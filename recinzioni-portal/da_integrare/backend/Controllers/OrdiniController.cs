using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.Services;
using System.Security.Claims;

namespace RecinzioniPortal.API.Controllers;

// ══════════════════════════════════════════════════════════════════════════════
//  ENDPOINT EURITMO — Da aggiungere/sostituire nel OrdiniController.cs
//  Le API CRUD ordini esistenti rimangono invariate.
//  Se il controller esiste già, mergiare costruttore e metodi.
// ══════════════════════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
public partial class OrdiniController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EuritmoService _euritmo;
    private readonly EmailService _email;
    private readonly ILogger<OrdiniController> _log;

    public OrdiniController(
        AppDbContext db,
        EuritmoService euritmo,
        EmailService email,
        ILogger<OrdiniController> log)
    {
        _db = db;
        _euritmo = euritmo;
        _email = email;
        _log = log;
    }

    // ── Auth helpers ────────────────────────────────────────────────────────
    private int GetUserId() => int.Parse(User.FindFirstValue("UserID") ?? "0");
    private string GetUserType() => User.FindFirstValue("UserType") ?? "";
    private string GetItemID() => User.FindFirstValue("ItemID") ?? "";
    private string GetItemIDSede() => User.FindFirstValue("ItemIDSede") ?? "";

    // ═══════════════════════════════════════════════════════════════════════
    //  PUT /api/ordini/{ordNum}/invia — Genera EDI + invia email fornitore
    // ═══════════════════════════════════════════════════════════════════════
    [Authorize]
    [HttpPut("{ordNum}/invia")]
    public async Task<IActionResult> InviaAlFornitore(int ordNum)
    {
        var ordine = await _db.OrdPrevTst.FirstOrDefaultAsync(o => o.OrdNum == ordNum);
        if (ordine == null)
            return NotFound(new ApiResponse { Success = false, Message = "Ordine non trovato" });

        if (!CanAccessOrder(ordine))
            return Forbid();

        if (!ordine.FlagConferma)
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "L'ordine deve essere confermato prima dell'invio"
            });

        // Genera file EURITMO
        var edi = await _euritmo.GeneraFileOrdine(ordNum);
        if (!edi.Success)
            return BadRequest(new ApiResponse { Success = false, Message = edi.Error });

        // Conteggio righe padre per riepilogo email
        var righeCount = await _db.OrdPrevDett
            .CountAsync(r => r.OrdNum == ordNum && r.RigaPadre == null);

        // Invia email con allegato
        var (emailOk, emailErr) = await _email.InviaOrdineFornitore(
            ordNum,
            ordine.FattRagSoc ?? "N/D",
            ordine.OrdData,
            righeCount,
            ordine.Totale,
            ordine.ConsIndirizzo ?? "",
            ordine.ConsCitta ?? "",
            edi.FilePath!,
            edi.FileName!);

        // Se email fallisce: file archiviato, flag NON aggiornato
        if (!emailOk)
        {
            _log.LogWarning("Email fallita ordine {Ord}: {Err}. File EDI archiviato.", ordNum, emailErr);
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = $"File EDI generato e archiviato, ma invio email fallito: {emailErr}"
            });
        }

        // Aggiorna flag solo dopo invio email riuscito
        ordine.FlagInvioFornitore = true;
        ordine.DataInvioFornitore = DateTime.Now;
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Ordine inviato al fornitore",
            Data = new { ediFile = edi.FileName, sentAt = ordine.DataInvioFornitore }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GET /api/ordini/{ordNum}/euritmo — Download file .edi
    // ═══════════════════════════════════════════════════════════════════════
    [Authorize]
    [HttpGet("{ordNum}/euritmo")]
    public async Task<IActionResult> DownloadEuritmo(int ordNum)
    {
        var ordine = await _db.OrdPrevTst.FirstOrDefaultAsync(o => o.OrdNum == ordNum);
        if (ordine == null)
            return NotFound(new ApiResponse { Success = false, Message = "Ordine non trovato" });

        if (!CanAccessOrder(ordine))
            return Forbid();

        // File archiviato o genera al volo
        string? path = _euritmo.GetArchivedFilePath(ordNum);
        if (path == null || !System.IO.File.Exists(path))
        {
            var r = await _euritmo.GeneraFileOrdine(ordNum);
            if (!r.Success) return BadRequest(new ApiResponse { Success = false, Message = r.Error });
            path = r.FilePath;
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(path!);
        return File(bytes, "text/plain", Path.GetFileName(path!));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GET /api/ordini/{ordNum}/euritmo/preview — Anteprima JSON contenuto
    // ═══════════════════════════════════════════════════════════════════════
    [Authorize]
    [HttpGet("{ordNum}/euritmo/preview")]
    public async Task<IActionResult> PreviewEuritmo(int ordNum)
    {
        var ordine = await _db.OrdPrevTst.FirstOrDefaultAsync(o => o.OrdNum == ordNum);
        if (ordine == null)
            return NotFound(new ApiResponse { Success = false, Message = "Ordine non trovato" });

        if (!CanAccessOrder(ordine))
            return Forbid();

        var r = await _euritmo.GeneraFileOrdine(ordNum);
        if (!r.Success)
            return BadRequest(new ApiResponse { Success = false, Message = r.Error });

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new
            {
                content = r.Content,
                fileName = r.FileName,
                sent = ordine.FlagInvioFornitore,
                sentAt = ordine.DataInvioFornitore
            }
        });
    }

    // ── Controllo accesso ordine ────────────────────────────────────────────
    private bool CanAccessOrder(Models.OrdPrevTst ordine)
    {
        string ut = GetUserType();
        if (ut == "1") return true;
        string iid = GetItemID();
        string sid = GetItemIDSede();
        return ut switch
        {
            "2" => ordine.ItemID == iid,
            "3" => ordine.ItemID == iid && ordine.ItemIDSede == sid,
            "4" => ordine.UserID == GetUserId(),
            _ => false
        };
    }
}

// ── ApiResponse wrapper (se non già presente nel progetto, altrimenti rimuovi) ──
// public class ApiResponse { public bool Success { get; set; } public string? Message { get; set; } }
// public class ApiResponse<T> : ApiResponse { public T? Data { get; set; } }
