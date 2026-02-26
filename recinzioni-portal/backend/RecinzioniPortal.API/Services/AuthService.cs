using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;

namespace RecinzioniPortal.API.Services;

/// <summary>
/// Servizio di autenticazione completo (Analisi Funzionale v1.5, §4.1).
/// Gestisce: login con brute-force protection, JWT + refresh token,
/// recupero password via email, reset password, cambio password,
/// validazione complessità password.
/// </summary>
public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    // Brute-force: max 5 tentativi falliti in 15 minuti
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutWindow = TimeSpan.FromMinutes(15);
    // Token reset password valido 24 ore
    private static readonly TimeSpan ResetTokenExpiry = TimeSpan.FromHours(24);

    public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // ==========================================================
    // LOGIN
    // ==========================================================

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress)
    {
        // 1. Verifica blocco brute-force
        if (await IsLockedOutAsync(request.Username))
        {
            _logger.LogWarning("Login bloccato per brute-force: {User} da IP {IP}",
                request.Username, ipAddress);
            return null;
        }

        // 2. Cerca utente
        var user = await _db.Utenti
            .FirstOrDefaultAsync(u => u.UserLogin == request.Username);

        if (user == null || string.IsNullOrEmpty(user.Password))
        {
            await RecordLoginAttemptAsync(request.Username, ipAddress, false);
            return null;
        }

        // 3. Verifica password (bcrypt)
        bool passwordValid;
        try
        {
            passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
        }
        catch
        {
            passwordValid = false;
        }

        if (!passwordValid)
        {
            await RecordLoginAttemptAsync(request.Username, ipAddress, false);
            _logger.LogWarning("Login fallito per {User} da IP {IP}", request.Username, ipAddress);
            return null;
        }

        // 4. Login riuscito: registra successo e genera token
        await RecordLoginAttemptAsync(request.Username, ipAddress, true);
        _logger.LogInformation("Login riuscito per {User} (tipo {Type}) da IP {IP}",
            user.UserLogin, user.UserType, ipAddress);

        var jwt = GenerateJwtToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.UserID);

        return new LoginResponse(jwt, refreshToken.Token, MapToDto(user));
    }

    /// <summary>
    /// Restituisce lo stato dei tentativi di login (per feedback al frontend).
    /// </summary>
    public async Task<(int failedCount, int remainingAttempts)> GetLoginStatusAsync(string username)
    {
        var since = DateTime.UtcNow - LockoutWindow;
        var failedCount = await _db.LoginAttempts
            .Where(a => a.Username == username && !a.Success && a.AttemptedAt >= since)
            .CountAsync();
        return (failedCount, Math.Max(0, MaxFailedAttempts - failedCount));
    }

    // ==========================================================
    // REFRESH TOKEN
    // ==========================================================

    public async Task<LoginResponse?> RefreshAsync(string refreshTokenStr)
    {
        var storedToken = await _db.RefreshTokens
            .Include(r => r.Utente)
            .FirstOrDefaultAsync(r => r.Token == refreshTokenStr);

        if (storedToken == null || !storedToken.IsActive || storedToken.Utente == null)
            return null;

        storedToken.Revoked = DateTime.UtcNow;
        var newRefresh = await GenerateRefreshTokenAsync(storedToken.UserID);
        await _db.SaveChangesAsync();

        var jwt = GenerateJwtToken(storedToken.Utente);
        return new LoginResponse(jwt, newRefresh.Token, MapToDto(storedToken.Utente));
    }

    // ==========================================================
    // FORGOT PASSWORD
    // ==========================================================

    /// <summary>
    /// Genera un token di reset password. Restituisce null se l'email non esiste
    /// (ma al client restituiamo sempre 200 per non rivelare se l'email esiste).
    /// </summary>
    public async Task<(Utente user, string token)?> GeneratePasswordResetTokenAsync(string email)
    {
        var user = await _db.Utenti
            .FirstOrDefaultAsync(u => u.MailAddress == email);

        if (user == null)
        {
            _logger.LogInformation("Reset password richiesto per email inesistente: {Email}", email);
            return null;
        }

        // Invalida token precedenti non usati per lo stesso utente
        var oldTokens = await _db.PasswordResetTokens
            .Where(t => t.UserID == user.UserID && t.UsedAt == null)
            .ToListAsync();
        foreach (var old in oldTokens)
            old.UsedAt = DateTime.UtcNow;

        // Genera token URL-safe
        var tokenBytes = RandomNumberGenerator.GetBytes(48);
        var tokenStr = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');

        var resetToken = new PasswordResetToken
        {
            UserID = user.UserID,
            Token = tokenStr,
            ExpiresAt = DateTime.UtcNow.Add(ResetTokenExpiry),
            CreatedAt = DateTime.UtcNow
        };

        _db.PasswordResetTokens.Add(resetToken);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Token reset generato per {User}, scade {Exp}",
            user.UserLogin, resetToken.ExpiresAt);

        return (user, tokenStr);
    }

    // ==========================================================
    // RESET PASSWORD (via token da email)
    // ==========================================================

    public async Task<(bool isValid, string message)> ValidateResetTokenAsync(string token)
    {
        var resetToken = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token);

        if (resetToken == null) return (false, "Token non valido.");
        if (resetToken.IsUsed)  return (false, "Questo link è già stato utilizzato.");
        if (resetToken.IsExpired) return (false, "Il link è scaduto (24h). Richiedi un nuovo reset.");
        return (true, "OK");
    }

    public async Task<(bool success, string message)> ResetPasswordAsync(string token, string newPassword)
    {
        var validation = ValidatePasswordComplexity(newPassword);
        if (!validation.isValid)
            return (false, validation.message);

        var resetToken = await _db.PasswordResetTokens
            .Include(t => t.Utente)
            .FirstOrDefaultAsync(t => t.Token == token);

        if (resetToken == null) return (false, "Token non valido.");
        if (resetToken.IsUsed)  return (false, "Link già utilizzato. Richiedi un nuovo reset.");
        if (resetToken.IsExpired) return (false, "Link scaduto. Richiedi un nuovo reset password.");
        if (resetToken.Utente == null) return (false, "Utente non trovato.");

        // Imposta nuova password
        resetToken.Utente.Password = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        resetToken.UsedAt = DateTime.UtcNow;

        // Revoca tutti i refresh token (logout da tutte le sessioni)
        var activeTokens = await _db.RefreshTokens
            .Where(r => r.UserID == resetToken.UserID && r.Revoked == null)
            .ToListAsync();
        foreach (var rt in activeTokens)
            rt.Revoked = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Password reimpostata per {User}", resetToken.Utente.UserLogin);
        return (true, "Password reimpostata con successo. Puoi ora accedere con la nuova password.");
    }

    // ==========================================================
    // CAMBIO PASSWORD (utente autenticato)
    // ==========================================================

    public async Task<(bool success, string message)> ChangePasswordAsync(
        short userId, string currentPassword, string newPassword)
    {
        var user = await _db.Utenti.FindAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.Password))
            return (false, "Utente non trovato.");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.Password))
            return (false, "La password attuale non è corretta.");

        var validation = ValidatePasswordComplexity(newPassword);
        if (!validation.isValid)
            return (false, validation.message);

        if (BCrypt.Net.BCrypt.Verify(newPassword, user.Password))
            return (false, "La nuova password deve essere diversa da quella attuale.");

        user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Password cambiata per utente {User}", user.UserLogin);
        return (true, "Password modificata con successo.");
    }

    // ==========================================================
    // VALIDAZIONE COMPLESSITÀ PASSWORD
    // ==========================================================

    public static (bool isValid, string message) ValidatePasswordComplexity(string password)
    {
        if (string.IsNullOrEmpty(password))
            return (false, "La password non può essere vuota.");
        if (password.Length < 8)
            return (false, "La password deve contenere almeno 8 caratteri.");
        if (!Regex.IsMatch(password, @"[A-Z]"))
            return (false, "La password deve contenere almeno una lettera maiuscola.");
        if (!Regex.IsMatch(password, @"[a-z]"))
            return (false, "La password deve contenere almeno una lettera minuscola.");
        if (!Regex.IsMatch(password, @"\d"))
            return (false, "La password deve contenere almeno un numero.");
        if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
            return (false, "La password deve contenere almeno un carattere speciale.");
        return (true, "OK");
    }

    // ==========================================================
    // HELPERS
    // ==========================================================

    private async Task<bool> IsLockedOutAsync(string username)
    {
        var since = DateTime.UtcNow - LockoutWindow;
        var failedCount = await _db.LoginAttempts
            .Where(a => a.Username == username && !a.Success && a.AttemptedAt >= since)
            .CountAsync();
        return failedCount >= MaxFailedAttempts;
    }

    private async Task RecordLoginAttemptAsync(string username, string? ip, bool success)
    {
        _db.LoginAttempts.Add(new LoginAttempt
        {
            Username = username,
            IpAddress = ip,
            AttemptedAt = DateTime.UtcNow,
            Success = success
        });
        await _db.SaveChangesAsync();
    }

    private string GenerateJwtToken(Utente user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]
                ?? "RecinzioniPortalSuperSecretKey2026!MustBeAtLeast32Chars"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
            new Claim(ClaimTypes.Name, user.UserLogin ?? ""),
            new Claim("UserType", user.UserType?.ToString() ?? "0"),
            new Claim("ItemID", user.ItemID ?? ""),
            new Claim("ItemIDSede", user.ItemIDSede ?? ""),
            new Claim("UserName", user.UserName ?? "")
        };

        var expiry = DateTime.UtcNow.AddHours(
            double.TryParse(_config["Jwt:ExpiryHours"], out var h) ? h : 8);

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "RecinzioniPortal",
            audience: _config["Jwt:Audience"] ?? "RecinzioniPortal",
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        ));
    }

    private async Task<RefreshToken> GenerateRefreshTokenAsync(short userId)
    {
        var token = new RefreshToken
        {
            UserID = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            Expires = DateTime.UtcNow.AddDays(30),
            Created = DateTime.UtcNow
        };
        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync();
        return token;
    }

    public static UserDto MapToDto(Utente u) => new(
        u.UserID, u.UserLogin, u.UserName, u.UserType,
        u.MailAddress, u.ItemID, u.ItemIDSede
    );
}
