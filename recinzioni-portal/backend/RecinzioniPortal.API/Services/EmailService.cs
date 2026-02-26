using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace RecinzioniPortal.API.Services;

public class SmtpConfig
{
    public string Host { get; set; } = "smtp.example.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string From { get; set; } = "noreply@portale-recinzioni.it";
    public string FromName { get; set; } = "Portale Recinzioni";
    public bool UseSsl { get; set; } = true;
}

public record EmailResult(bool Success, string? Error);

public class EmailService
{
    private readonly SmtpConfig _smtp;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
        _smtp = new SmtpConfig();
        config.GetSection("Smtp").Bind(_smtp);
    }

    // ── INVIO ORDINE AL FORNITORE con allegato .edi ─────────
    public async Task<EmailResult> InviaOrdineFornitore(
        int ordNum, string ragSocCliente, DateTime dataOrdine,
        int numRighe, decimal totale,
        string consegnaIndirizzo, string consegnaCitta,
        string? note, string ediFilePath, string ediContent)
    {
        try
        {
            var destinatario = _config["Euritmo:FornitoreEmail"] ?? "ordini@fornitore.example.com";
            var oggetto = $"Ordine N. {ordNum} - {ragSocCliente} - {dataOrdine:dd/MM/yyyy}";
            var corpo = BuildHtmlOrdine(ordNum, ragSocCliente, dataOrdine, numRighe,
                totale, consegnaIndirizzo, consegnaCitta, note);

            var attachment = new Attachment(
                new MemoryStream(Encoding.GetEncoding("iso-8859-1").GetBytes(ediContent)),
                Path.GetFileName(ediFilePath), "text/plain");

            return await InviaEmail(destinatario, oggetto, corpo, attachment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore invio email ordine {OrdNum}", ordNum);
            return new EmailResult(false, $"Errore invio email: {ex.Message}");
        }
    }

    // ── RECUPERO PASSWORD ───────────────────────────────────
    public async Task<EmailResult> InviaRecuperoPassword(string email, string userName, string resetLink)
    {
        try
        {
            var oggetto = "Recupero password - Portale Recinzioni";
            var corpo = BuildHtmlRecuperoPassword(userName, resetLink);
            return await InviaEmail(email, oggetto, corpo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore invio email recupero password per {Email}", email);
            return new EmailResult(false, $"Errore invio email: {ex.Message}");
        }
    }

    // ── INVIO SMTP ──────────────────────────────────────────
    private async Task<EmailResult> InviaEmail(string destinatario, string oggetto, string corpoHtml, Attachment? attachment = null)
    {
        try
        {
            using var client = new SmtpClient(_smtp.Host, _smtp.Port)
            {
                Credentials = new NetworkCredential(_smtp.Username, _smtp.Password),
                EnableSsl = _smtp.UseSsl
            };

            var message = new MailMessage
            {
                From = new MailAddress(_smtp.From, _smtp.FromName),
                Subject = oggetto, Body = corpoHtml, IsBodyHtml = true,
                SubjectEncoding = Encoding.UTF8, BodyEncoding = Encoding.UTF8
            };
            message.To.Add(destinatario);
            if (attachment != null) message.Attachments.Add(attachment);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email inviata a {Dest}: {Oggetto}", destinatario, oggetto);
            return new EmailResult(true, null);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP error per {Dest}", destinatario);
            return new EmailResult(false, $"Errore SMTP: {ex.Message}");
        }
    }

    // ── TEMPLATE HTML — INVIO ORDINE ────────────────────────
    private static string BuildHtmlOrdine(int ordNum, string ragSoc, DateTime data,
        int numRighe, decimal totale, string indirizzo, string citta, string? note)
    {
        var noteSection = string.IsNullOrWhiteSpace(note) ? "" : $@"
            <tr>
                <td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">Note</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;"">{Esc(note)}</td>
            </tr>";

        return $@"<!DOCTYPE html>
<html><head><meta charset=""utf-8""></head>
<body style=""margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);"">
    <tr><td style=""background:#1e40af;padding:24px 32px;"">
        <h1 style=""margin:0;color:#fff;font-size:20px;"">Nuovo Ordine N. {ordNum}</h1>
        <p style=""margin:4px 0 0;color:#93c5fd;font-size:14px;"">Portale Recinzioni - Ordine ricevuto il {data:dd/MM/yyyy}</p>
    </td></tr>
    <tr><td style=""padding:24px 32px;"">
        <p style=""font-size:15px;color:#333;margin:0 0 16px;"">
            È stato inviato un nuovo ordine dal portale. In allegato il file EURITMO ORDERS (.edi).
        </p>
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin:16px 0;"">
            <tr style=""background:#f9fafb;""><td colspan=""2"" style=""padding:12px 16px;font-weight:bold;font-size:15px;color:#1e40af;border-bottom:1px solid #e5e7eb;"">Riepilogo Ordine</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;width:140px;"">Cliente</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;font-weight:bold;"">{Esc(ragSoc)}</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">N. Ordine</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;"">{ordNum}</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">Data</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;"">{data:dd/MM/yyyy}</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">Righe prodotto</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;"">{numRighe}</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">Totale</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;font-weight:bold;color:#059669;"">&euro; {totale:N2}</td></tr>
            <tr><td style=""padding:8px 16px;color:#666;font-size:14px;border-bottom:1px solid #eee;"">Consegna</td>
                <td style=""padding:8px 16px;font-size:14px;border-bottom:1px solid #eee;"">{Esc(indirizzo)}, {Esc(citta)}</td></tr>
            {noteSection}
        </table>
    </td></tr>
    <tr><td style=""background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;"">
        Email generata automaticamente dal Portale Recinzioni. Non rispondere a questo messaggio.
    </td></tr>
</table></body></html>";
    }

    // ── TEMPLATE HTML — RECUPERO PASSWORD ───────────────────
    private static string BuildHtmlRecuperoPassword(string userName, string resetLink)
    {
        return $@"<!DOCTYPE html>
<html><head><meta charset=""utf-8""></head>
<body style=""margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);"">
    <tr><td style=""background:#1e40af;padding:24px 32px;"">
        <h1 style=""margin:0;color:#fff;font-size:20px;"">Recupero Password</h1>
        <p style=""margin:4px 0 0;color:#93c5fd;font-size:14px;"">Portale Recinzioni</p>
    </td></tr>
    <tr><td style=""padding:24px 32px;"">
        <p style=""font-size:15px;color:#333;margin:0 0 16px;"">Ciao <strong>{Esc(userName)}</strong>,</p>
        <p style=""font-size:15px;color:#333;margin:0 0 24px;"">Hai richiesto il reset della password. Clicca il pulsante qui sotto:</p>
        <div style=""text-align:center;margin:24px 0;"">
            <a href=""{resetLink}"" style=""display:inline-block;background:#1e40af;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;"">Reimposta Password</a>
        </div>
        <p style=""font-size:13px;color:#9ca3af;margin:24px 0 0;"">Se non hai richiesto tu questa operazione, ignora questa email. Il link scadrà tra 1 ora.</p>
    </td></tr>
    <tr><td style=""background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;"">
        Email generata automaticamente dal Portale Recinzioni. Non rispondere a questo messaggio.
    </td></tr>
</table></body></html>";
    }

    private static string Esc(string? text)
    {
        if (string.IsNullOrEmpty(text)) return "";
        return text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
    }
}
