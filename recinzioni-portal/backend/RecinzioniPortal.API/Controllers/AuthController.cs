using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Services;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly EmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AuthService auth, EmailService email,
        IConfiguration config, ILogger<AuthController> logger)
    {
        _auth = auth;
        _email = email;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/auth/login - Login con protezione brute-force
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.LoginAsync(request, ip);

        if (result == null)
        {
            // Restituisci info sui tentativi rimanenti
            var (failed, remaining) = await _auth.GetLoginStatusAsync(request.Username);
            var msg = remaining > 0
                ? $"Credenziali non valide. Tentativi rimanenti: {remaining}"
                : "Account temporaneamente bloccato per troppi tentativi. Riprova tra 15 minuti.";

            return Unauthorized(new ApiResponse(false, msg));
        }

        return Ok(new ApiResponse<LoginResponse>(true, null, result));
    }

    /// <summary>
    /// POST /api/auth/refresh - Rinnova JWT tramite refresh token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _auth.RefreshAsync(request.RefreshToken);
        if (result == null)
            return Unauthorized(new ApiResponse(false, "Token non valido o scaduto."));

        return Ok(new ApiResponse<LoginResponse>(true, null, result));
    }

    /// <summary>
    /// GET /api/auth/me - Restituisce l'utente corrente dal token JWT
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var user = new UserDto(
            short.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0"),
            User.FindFirst(ClaimTypes.Name)?.Value,
            User.FindFirst("UserName")?.Value,
            byte.TryParse(User.FindFirst("UserType")?.Value, out var ut) ? ut : (byte)0,
            null,
            User.FindFirst("ItemID")?.Value,
            User.FindFirst("ItemIDSede")?.Value
        );
        return Ok(new ApiResponse<UserDto>(true, null, user));
    }

    /// <summary>
    /// POST /api/auth/forgot-password - Invio email con link di reset
    /// Restituisce sempre 200 per non rivelare se l'email esiste.
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        const string genericMsg = "Se l'indirizzo email è registrato, riceverai un link per reimpostare la password.";

        var result = await _auth.GeneratePasswordResetTokenAsync(request.Email);

        if (result != null)
        {
            var (user, token) = result.Value;
            var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            try
            {
                await _email.InviaRecuperoPassword(
                    request.Email,
                    user.UserName ?? "Utente",
                    resetLink);

                _logger.LogInformation("Email reset password inviata a {Email}", request.Email);
            }
            catch (Exception ex)
            {
                // Non blocchiamo il flusso se l'email fallisce, logghiamo l'errore
                _logger.LogError(ex, "Errore invio email reset password a {Email}", request.Email);
            }
        }

        // Risposta sempre identica (sicurezza: non rivelare esistenza email)
        return Ok(new ApiResponse(true, genericMsg));
    }

    /// <summary>
    /// GET /api/auth/validate-reset-token?token=xxx - Verifica validità token reset
    /// (chiamata dal frontend quando apre la pagina reset-password)
    /// </summary>
    [HttpGet("validate-reset-token")]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
    {
        var (isValid, message) = await _auth.ValidateResetTokenAsync(token);
        if (!isValid)
            return BadRequest(new ApiResponse(false, message));

        return Ok(new ApiResponse(true, message));
    }

    /// <summary>
    /// POST /api/auth/reset-password - Reimposta la password con il token ricevuto via email
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var (success, message) = await _auth.ResetPasswordAsync(request.Token, request.NewPassword);

        if (!success)
            return BadRequest(new ApiResponse(false, message));

        return Ok(new ApiResponse(true, message));
    }

    /// <summary>
    /// POST /api/auth/change-password - Cambio password dall'interno dell'applicazione (utente autenticato)
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = short.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var (success, message) = await _auth.ChangePasswordAsync(
            userId, request.CurrentPassword, request.NewPassword);

        if (!success)
            return BadRequest(new ApiResponse(false, message));

        return Ok(new ApiResponse(true, message));
    }

    /// <summary>
    /// GET /api/auth/password-rules - Restituisce le regole di complessità password
    /// (utile per il frontend per mostrare i requisiti)
    /// </summary>
    [HttpGet("password-rules")]
    public IActionResult GetPasswordRules()
    {
        return Ok(new ApiResponse<object>(true, null, new
        {
            MinLength = 8,
            RequireUppercase = true,
            RequireLowercase = true,
            RequireDigit = true,
            RequireSpecialChar = true,
            SpecialChars = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/\\"
        }));
    }
}
