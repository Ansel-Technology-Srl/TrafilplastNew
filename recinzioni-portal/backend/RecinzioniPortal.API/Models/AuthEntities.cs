using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecinzioniPortal.API.Models;

/// <summary>
/// Token temporaneo per il recupero password via email (Analisi Funzionale §4.1)
/// </summary>
[Table("PasswordResetTokens")]
public class PasswordResetToken
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TokenID { get; set; }

    public short UserID { get; set; }

    [StringLength(128)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>NULL = non ancora usato, valorizzato = già consumato</summary>
    public DateTime? UsedAt { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsUsed => UsedAt != null;
    public bool IsValid => !IsExpired && !IsUsed;

    [ForeignKey("UserID")]
    public Utente? Utente { get; set; }
}

/// <summary>
/// Tracking dei tentativi di login per protezione brute-force (Analisi Funzionale §4.1)
/// </summary>
[Table("LoginAttempts")]
public class LoginAttempt
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AttemptID { get; set; }

    [StringLength(32)]
    public string Username { get; set; } = string.Empty;

    [StringLength(45)]
    public string? IpAddress { get; set; }

    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public bool Success { get; set; }
}
