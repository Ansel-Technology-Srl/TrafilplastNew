using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;
using RecinzioniPortal.API.Services;
using System.Security.Claims;
using System.Text.Json;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdiniController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PdfService _pdfService;
    private readonly EuritmoService _euritmo;
    private readonly EmailService _email;

    public OrdiniController(AppDbContext db, PdfService pdfService, EuritmoService euritmo, EmailService email)
    {
        _db = db;
        _pdfService = pdfService;
        _euritmo = euritmo;
        _email = email;
    }

    // ─── Helper JWT Claims ─────────────────────────────────────────
    private short GetUserID() => short.Parse(User.FindFirstValue("UserID") ?? "0");
    private string GetUserType() => User.FindFirstValue("UserType") ?? "";
    private string? GetItemID() => User.FindFirstValue("ItemID");
    private string? GetItemIDSede() => User.FindFirstValue("ItemIDSede");
    private bool IsCapoNegozio() => GetUserType() == "3";
    private bool IsOperatore() => GetUserType() == "4";

    private bool CanAccessOrder(OrdineTestata ord)
    {
        if (IsCapoNegozio())
            return ord.ItemIDSede == GetItemIDSede() && ord.ItemID == GetItemID();
        if (IsOperatore())
            return ord.UserID == GetUserID();
        return false;
    }

    // ─── GET /api/ordini ───────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetOrdini(
        [FromQuery] string? stato,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Set<OrdineTestata>().AsQueryable();

        if (IsOperatore())
            query = query.Where(o => o.UserID == GetUserID());
        else if (IsCapoNegozio())
            query = query.Where(o => o.ItemID == GetItemID() && o.ItemIDSede == GetItemIDSede());
        else
            return Forbid();

        if (!string.IsNullOrEmpty(stato) && stato != "tutti")
            query = query.Where(o => o.Stato == stato);

        if (!string.IsNullOrEmpty(search))
        {
            if (int.TryParse(search, out int numSearch))
                query = query.Where(o => o.OrdNum == numSearch);
            else
                query = query.Where(o => o.FattRagSoc != null && o.FattRagSoc.Contains(search));
        }

        var total = await query.CountAsync();

        var baseQuery = _db.Set<OrdineTestata>().AsQueryable();
        if (IsOperatore())
            baseQuery = baseQuery.Where(o => o.UserID == GetUserID());
        else
            baseQuery = baseQuery.Where(o => o.ItemID == GetItemID() && o.ItemIDSede == GetItemIDSede());

        var countCarrello = await baseQuery.CountAsync(o => o.Stato == "Carrello");
        var countPreventivo = await baseQuery.CountAsync(o => o.Stato == "Preventivo");
        var countOrdine = await baseQuery.CountAsync(o => o.Stato == "Ordine");

        var items = await query
            .OrderByDescending(o => o.OrdNum)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.OrdNum,
                o.OrdData,
                o.Stato,
                o.FattRagSoc,
                o.Subtotale,
                o.ImportoIVA,
                o.Totale,
                o.FlagConferma,
                o.FlagInvioFornitore,
                o.DataInvioFornitore,
                o.Note,
                NumRighe = o.Righe.Count(r => r.RigaPadre == null)
            })
            .ToListAsync();

        return Ok(new ApiResponse<object>(true, null, new
        {
            items,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            counts = new { carrello = countCarrello, preventivo = countPreventivo, ordine = countOrdine }
        }));
    }

    // ─── GET /api/ordini/{ordNum} ──────────────────────────────────
    [HttpGet("{ordNum}")]
    public async Task<IActionResult> GetDettaglio(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();

        var configList = await _db.Set<OrdineConfig>()
            .Where(c => c.OrdNum == ordNum)
            .ToListAsync();

        var righePadre = ordine.Righe
            .Where(r => r.RigaPadre == null)
            .OrderBy(r => r.RigaNum)
            .ToList();

        var righeOutput = righePadre.Select(padre =>
        {
            var figli = ordine.Righe
                .Where(r => r.RigaPadre == padre.RigaNum)
                .OrderBy(r => r.RigaNum)
                .Select(f => new
                {
                    f.RigaNum,
                    f.PrdCod,
                    f.PrdDes,
                    f.PrdUm,
                    f.Quantita,
                    f.PrezzoUnitario,
                    f.PrezzoTotale
                })
                .ToList();

            var config = configList.FirstOrDefault(c => c.RigaNum == padre.RigaNum);

            return new
            {
                padre.RigaNum,
                padre.PrdCod,
                padre.PrdDes,
                padre.PrdUm,
                padre.Quantita,
                padre.PrezzoUnitario,
                padre.PrezzoTotale,
                IsConfigured = figli.Any(),
                Componenti = figli,
                Config = config == null ? null : new
                {
                    config.ColoreDoghe,
                    config.ColorePali,
                    config.StessoColore,
                    config.Fissaggio,
                    config.TipoDoghe,
                    config.AltezzaPali,
                    config.NumeroDoghe,
                    config.NumeroSezioni,
                    config.SezioniJson
                }
            };
        }).ToList();

        return Ok(new ApiResponse<object>(true, null, new
        {
            ordine.OrdNum,
            ordine.OrdData,
            ordine.Stato,
            ordine.UserID,
            ordine.FattRagSoc,
            ordine.FattIndirizzo,
            ordine.FattCap,
            ordine.FattCitta,
            ordine.FattProvincia,
            ordine.FattPIva,
            ordine.FattCFis,
            ordine.ConsRagSoc,
            ordine.ConsIndirizzo,
            ordine.ConsCap,
            ordine.ConsCitta,
            ordine.ConsProvincia,
            ordine.PagCod,
            ordine.PagDescrizione,
            ordine.Subtotale,
            ordine.AliquotaIVA,
            ordine.ImportoIVA,
            ordine.Totale,
            ordine.Note,
            ordine.FlagConferma,
            ordine.FlagInvioFornitore,
            ordine.DataInvioFornitore,
            Righe = righeOutput
        }));
    }

    // ─── GET /api/ordini/dati-anagrafica ───────────────────────────
    [HttpGet("dati-anagrafica")]
    public async Task<IActionResult> GetDatiAnagrafica()
    {
        var itemId = GetItemID();
        var itemIdSede = GetItemIDSede();

        var cliente = await _db.Set<Cliente>()
            .FirstOrDefaultAsync(c => c.ItemID == itemId);

        var pdv = await _db.Set<PuntoDiVendita>()
            .FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == itemIdSede);

        return Ok(new ApiResponse<object>(true, null, new
        {
            fatturazione = new
            {
                ragSoc = cliente?.ItemDes ?? "",
                indirizzo = cliente?.Ind ?? "",
                cap = cliente?.Cap ?? "",
                citta = cliente?.Loc ?? "",
                provincia = cliente?.Pro ?? "",
                pIva = cliente?.PIva ?? "",
                cFis = cliente?.CFis ?? ""
            },
            consegna = new
            {
                ragSoc = pdv?.ItemDes ?? cliente?.ItemDes ?? "",
                indirizzo = pdv?.Ind ?? "",
                cap = pdv?.Cap ?? "",
                citta = pdv?.Loc ?? "",
                provincia = pdv?.Pro ?? ""
            },
            pagamento = cliente?.PagCod ?? ""
        }));
    }

    // ─── POST /api/ordini ──────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreaPreventivo([FromBody] CreaOrdineRequest request)
    {
        if (request == null || request.Items == null || !request.Items.Any())
            return BadRequest(new ApiResponse(false, "Nessun prodotto nel carrello."));

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            decimal subtotale = 0;
            foreach (var item in request.Items)
            {
                if (item.IsConfigured && item.Componenti != null)
                    subtotale += item.Componenti.Sum(c => (c.PrezzoTotale ?? 0));
                else
                    subtotale += (item.PrezzoUnitario ?? 0) * (item.Quantita ?? 0);
            }

            decimal aliquotaIva = 22.00m;
            decimal importoIva = Math.Round(subtotale * aliquotaIva / 100, 2);
            decimal totale = subtotale + importoIva;

            var testata = new OrdineTestata
            {
                OrdData = DateTime.Today,
                UserID = GetUserID(),
                ItemID = GetItemID(),
                ItemIDSede = GetItemIDSede(),
                Stato = "Preventivo",
                FattRagSoc = request.FattRagSoc,
                FattIndirizzo = request.FattIndirizzo,
                FattCap = request.FattCap,
                FattCitta = request.FattCitta,
                FattProvincia = request.FattProvincia,
                FattPIva = request.FattPIva,
                FattCFis = request.FattCFis,
                ConsRagSoc = request.ConsRagSoc,
                ConsIndirizzo = request.ConsIndirizzo,
                ConsCap = request.ConsCap,
                ConsCitta = request.ConsCitta,
                ConsProvincia = request.ConsProvincia,
                PagCod = request.PagCod,
                PagDescrizione = request.PagDescrizione,
                Subtotale = subtotale,
                AliquotaIVA = aliquotaIva,
                ImportoIVA = importoIva,
                Totale = totale,
                Note = request.Note,
                FlagConferma = false,
                FlagInvioFornitore = false
            };

            _db.Set<OrdineTestata>().Add(testata);
            await _db.SaveChangesAsync();

            // --- Phase 1: add all OrdineDettaglio rows ---
            int rigaNum = 1;
            var configsToAdd = new List<(int RigaPadreNum, ConfigRecinzioneDto Config)>();

            foreach (var item in request.Items)
            {
                int rigaPadreNum = rigaNum;

                var rigaPadre = new OrdineDettaglio
                {
                    OrdNum = testata.OrdNum,
                    RigaNum = rigaNum,
                    RigaPadre = null,
                    PrdCod = item.PrdCod,
                    PrdDes = item.PrdDes,
                    PrdUm = item.PrdUm,
                    Quantita = item.Quantita,
                    PrezzoUnitario = item.IsConfigured ? null : item.PrezzoUnitario,
                    PrezzoTotale = item.IsConfigured
                        ? item.Componenti?.Sum(c => c.PrezzoTotale ?? 0) ?? 0
                        : (item.PrezzoUnitario ?? 0) * (item.Quantita ?? 0)
                };
                _db.Set<OrdineDettaglio>().Add(rigaPadre);
                rigaNum++;

                if (item.IsConfigured && item.Componenti != null)
                {
                    foreach (var comp in item.Componenti)
                    {
                        _db.Set<OrdineDettaglio>().Add(new OrdineDettaglio
                        {
                            OrdNum = testata.OrdNum,
                            RigaNum = rigaNum,
                            RigaPadre = rigaPadreNum,
                            PrdCod = comp.PrdCod,
                            PrdDes = comp.PrdDes,
                            PrdUm = comp.PrdUm,
                            Quantita = comp.Quantita,
                            PrezzoUnitario = comp.PrezzoUnitario,
                            PrezzoTotale = comp.PrezzoTotale
                        });
                        rigaNum++;
                    }

                    if (item.Config != null)
                        configsToAdd.Add((rigaPadreNum, item.Config));
                }
            }

            // Save detail rows first (FK parent for OrdPrevConfig)
            await _db.SaveChangesAsync();

            // --- Phase 2: add OrdineConfig rows (detail rows now exist in DB) ---
            foreach (var (rigaPadreNum, config) in configsToAdd)
            {
                _db.Set<OrdineConfig>().Add(new OrdineConfig
                {
                    OrdNum = testata.OrdNum,
                    RigaNum = rigaPadreNum,
                    ColoreDoghe = config.ColoreDoghe,
                    ColorePali = config.ColorePali,
                    StessoColore = config.StessoColore,
                    Fissaggio = config.Fissaggio,
                    TipoDoghe = config.TipoDoghe,
                    AltezzaPali = config.AltezzaPali,
                    NumeroDoghe = config.NumeroDoghe,
                    NumeroSezioni = config.NumeroSezioni,
                    SezioniJson = config.SezioniJson
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new ApiResponse<object>(true, null, new { ordNum = testata.OrdNum }));
        }
        catch (DbUpdateException dbEx)
        {
            await transaction.RollbackAsync();
            var innerMsg = dbEx.InnerException?.Message ?? dbEx.Message;
            return StatusCode(500, new ApiResponse(false, $"Errore database durante la creazione del preventivo: {innerMsg}"));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            var innerMsg = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new ApiResponse(false, $"Errore durante la creazione: {innerMsg}"));
        }
    }

    // ─── PUT /api/ordini/{ordNum} ──────────────────────────────────
    [HttpPut("{ordNum}")]
    public async Task<IActionResult> ModificaPreventivo(int ordNum, [FromBody] ModificaOrdineRequest request)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (ordine.Stato != "Preventivo" || ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "Solo i preventivi non confermati possono essere modificati."));

        ordine.FattRagSoc = request.FattRagSoc ?? ordine.FattRagSoc;
        ordine.FattIndirizzo = request.FattIndirizzo ?? ordine.FattIndirizzo;
        ordine.FattCap = request.FattCap ?? ordine.FattCap;
        ordine.FattCitta = request.FattCitta ?? ordine.FattCitta;
        ordine.FattProvincia = request.FattProvincia ?? ordine.FattProvincia;
        ordine.FattPIva = request.FattPIva ?? ordine.FattPIva;
        ordine.FattCFis = request.FattCFis ?? ordine.FattCFis;
        ordine.ConsRagSoc = request.ConsRagSoc ?? ordine.ConsRagSoc;
        ordine.ConsIndirizzo = request.ConsIndirizzo ?? ordine.ConsIndirizzo;
        ordine.ConsCap = request.ConsCap ?? ordine.ConsCap;
        ordine.ConsCitta = request.ConsCitta ?? ordine.ConsCitta;
        ordine.ConsProvincia = request.ConsProvincia ?? ordine.ConsProvincia;
        ordine.PagCod = request.PagCod ?? ordine.PagCod;
        ordine.PagDescrizione = request.PagDescrizione ?? ordine.PagDescrizione;
        ordine.Note = request.Note ?? ordine.Note;

        if (request.RigheModificate != null)
        {
            foreach (var mod in request.RigheModificate)
            {
                var riga = ordine.Righe.FirstOrDefault(r => r.RigaNum == mod.RigaNum);
                if (riga != null && riga.RigaPadre == null)
                {
                    if (mod.Quantita.HasValue && mod.Quantita > 0)
                    {
                        riga.Quantita = mod.Quantita;
                        riga.PrezzoTotale = (riga.PrezzoUnitario ?? 0) * mod.Quantita.Value;
                    }
                }
            }
        }

        RicalcolaTotali(ordine);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<object>(true, null, new { ordine.OrdNum, ordine.Subtotale, ordine.ImportoIVA, ordine.Totale }));
    }

    // ─── PUT /api/ordini/{ordNum}/conferma ─────────────────────────
    [HttpPut("{ordNum}/conferma")]
    public async Task<IActionResult> ConfermaOrdine(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "Ordine già confermato."));

        ordine.Stato = "Ordine";
        ordine.FlagConferma = true;
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse(true, "Ordine confermato con successo."));
    }

    // ─── PUT /api/ordini/{ordNum}/invia ────────────────────────────
    [HttpPut("{ordNum}/invia")]
    public async Task<IActionResult> InviaFornitore(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (!ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "L'ordine deve essere confermato prima dell'invio."));

        // 1. Genera file EURITMO
        var edi = await _euritmo.GeneraFileOrdine(ordNum);
        if (!edi.Success)
            return StatusCode(500, new ApiResponse(false, $"Errore generazione EURITMO: {edi.Error}"));

        // 2. Invia email al fornitore con allegato .edi
        int numRighe = ordine.Righe.Count(r => r.RigaPadre == null);
        var emailResult = await _email.InviaOrdineFornitore(
            ordNum,
            ordine.FattRagSoc ?? "N/D",
            ordine.OrdData,
            numRighe,
            ordine.Totale,
            ordine.ConsIndirizzo ?? "",
            ordine.ConsCitta ?? "",
            ordine.Note,
            edi.FilePath!,
            edi.Content!);

        // 3. Aggiorna flag anche se email fallisce (il file EDI è generato)
        ordine.FlagInvioFornitore = true;
        ordine.DataInvioFornitore = DateTime.Now;
        await _db.SaveChangesAsync();

        if (!emailResult.Success)
            return Ok(new ApiResponse<object>(true,
                $"File EURITMO generato. Attenzione: invio email fallito ({emailResult.Error}). Il file è comunque disponibile.",
                new { sentAt = ordine.DataInvioFornitore, ediFile = edi.FileName, emailSent = false }));

        return Ok(new ApiResponse<object>(true, "Ordine inviato al fornitore.",
            new { sentAt = ordine.DataInvioFornitore, ediFile = edi.FileName, emailSent = true }));
    }

    // ─── GET /api/ordini/{ordNum}/euritmo ────────────────────────
    [HttpGet("{ordNum}/euritmo")]
    public async Task<IActionResult> DownloadEuritmo(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (!ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "L'ordine deve essere confermato."));

        // Genera (o rigenera) il file
        var edi = await _euritmo.GeneraFileOrdine(ordNum);
        if (!edi.Success)
            return StatusCode(500, new ApiResponse(false, $"Errore: {edi.Error}"));

        return File(
            System.Text.Encoding.ASCII.GetBytes(edi.Content!),
            "text/plain",
            edi.FileName);
    }

    // ─── GET /api/ordini/{ordNum}/euritmo/preview ────────────────
    [HttpGet("{ordNum}/euritmo/preview")]
    public async Task<IActionResult> PreviewEuritmo(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (!ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "L'ordine deve essere confermato."));

        var edi = await _euritmo.GeneraFileOrdine(ordNum);
        if (!edi.Success)
            return StatusCode(500, new ApiResponse(false, $"Errore: {edi.Error}"));

        return Ok(new ApiResponse<object>(true, null, new
        {
            content = edi.Content,
            fileName = edi.FileName,
            sent = ordine.FlagInvioFornitore,
            sentAt = ordine.DataInvioFornitore
        }));
    }

    // ─── GET /api/ordini/{ordNum}/pdf ──────────────────────────────
    [HttpGet("{ordNum}/pdf")]
    public async Task<IActionResult> GeneraPdf(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();

        var configList = await _db.Set<OrdineConfig>()
            .Where(c => c.OrdNum == ordNum)
            .ToListAsync();

        var pdv = await _db.Set<PuntoDiVendita>()
            .FirstOrDefaultAsync(p => p.ItemID == ordine.ItemID && p.ItemIDSede == ordine.ItemIDSede);

        string? logoPath = null;
        var possibleLogo = Path.Combine("wwwroot", "logos", $"{ordine.ItemID}.png");
        if (System.IO.File.Exists(possibleLogo))
            logoPath = possibleLogo;

        try
        {
            var pdfBytes = _pdfService.GeneraPdf(ordine, configList, pdv, logoPath);

            var tipoDoc = ordine.FlagConferma ? "ordine" : "preventivo";
            return File(pdfBytes, "application/pdf", $"{tipoDoc}_{ordNum}.pdf");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[PDF] Errore generazione PDF ordine {ordNum}: {ex}");
            return StatusCode(500, new ApiResponse(false, $"Errore generazione PDF: {ex.Message}"));
        }
    }

    // ─── DELETE /api/ordini/{ordNum} ───────────────────────────────
    [HttpDelete("{ordNum}")]
    public async Task<IActionResult> EliminaOrdine(int ordNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "Non è possibile eliminare un ordine confermato."));

        var configs = await _db.Set<OrdineConfig>()
            .Where(c => c.OrdNum == ordNum)
            .ToListAsync();
        _db.Set<OrdineConfig>().RemoveRange(configs);

        _db.Set<OrdineDettaglio>().RemoveRange(ordine.Righe);
        _db.Set<OrdineTestata>().Remove(ordine);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse(true, "Ordine eliminato."));
    }

    // ─── DELETE /api/ordini/{ordNum}/righe/{rigaNum} ────────────────
    [HttpDelete("{ordNum}/righe/{rigaNum}")]
    public async Task<IActionResult> EliminaRiga(int ordNum, int rigaNum)
    {
        var ordine = await _db.Set<OrdineTestata>()
            .Include(o => o.Righe)
            .FirstOrDefaultAsync(o => o.OrdNum == ordNum);

        if (ordine == null)
            return NotFound(new ApiResponse(false, "Ordine non trovato."));
        if (!CanAccessOrder(ordine))
            return Forbid();
        if (ordine.FlagConferma)
            return BadRequest(new ApiResponse(false, "Non è possibile modificare un ordine confermato."));

        var riga = ordine.Righe.FirstOrDefault(r => r.RigaNum == rigaNum);
        if (riga == null)
            return NotFound(new ApiResponse(false, "Riga non trovata."));

        if (riga.RigaPadre == null)
        {
            var figli = ordine.Righe.Where(r => r.RigaPadre == rigaNum).ToList();
            _db.Set<OrdineDettaglio>().RemoveRange(figli);

            var config = await _db.Set<OrdineConfig>()
                .FirstOrDefaultAsync(c => c.OrdNum == ordNum && c.RigaNum == rigaNum);
            if (config != null)
                _db.Set<OrdineConfig>().Remove(config);
        }

        _db.Set<OrdineDettaglio>().Remove(riga);

        RicalcolaTotali(ordine);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<object>(true, null, new { ordine.Subtotale, ordine.ImportoIVA, ordine.Totale }));
    }

    // ─── Helper: ricalcola totali ──────────────────────────────────
    private void RicalcolaTotali(OrdineTestata ordine)
    {
        var righePadre = ordine.Righe.Where(r => r.RigaPadre == null).ToList();
        ordine.Subtotale = righePadre.Sum(r => r.PrezzoTotale ?? 0);
        ordine.ImportoIVA = Math.Round(ordine.Subtotale * ordine.AliquotaIVA / 100, 2);
        ordine.Totale = ordine.Subtotale + ordine.ImportoIVA;
    }
}

// ─── DTO per richieste ─────────────────────────────────────────────

public record CreaOrdineRequest
{
    public string? FattRagSoc { get; init; }
    public string? FattIndirizzo { get; init; }
    public string? FattCap { get; init; }
    public string? FattCitta { get; init; }
    public string? FattProvincia { get; init; }
    public string? FattPIva { get; init; }
    public string? FattCFis { get; init; }
    public string? ConsRagSoc { get; init; }
    public string? ConsIndirizzo { get; init; }
    public string? ConsCap { get; init; }
    public string? ConsCitta { get; init; }
    public string? ConsProvincia { get; init; }
    public string? PagCod { get; init; }
    public string? PagDescrizione { get; init; }
    public string? Note { get; init; }
    public List<CreaOrdineItemDto> Items { get; init; } = new();
}

public record CreaOrdineItemDto
{
    public string? PrdCod { get; init; }
    public string? PrdDes { get; init; }
    public string? PrdUm { get; init; }
    public decimal? Quantita { get; init; }
    public decimal? PrezzoUnitario { get; init; }
    public bool IsConfigured { get; init; }
    public List<ComponenteDto>? Componenti { get; init; }
    public ConfigRecinzioneDto? Config { get; init; }
}

public record ComponenteDto
{
    public string? PrdCod { get; init; }
    public string? PrdDes { get; init; }
    public string? PrdUm { get; init; }
    public decimal? Quantita { get; init; }
    public decimal? PrezzoUnitario { get; init; }
    public decimal? PrezzoTotale { get; init; }
}

public record ConfigRecinzioneDto
{
    public string? ColoreDoghe { get; init; }
    public string? ColorePali { get; init; }
    public bool? StessoColore { get; init; }
    public string? Fissaggio { get; init; }
    public string? TipoDoghe { get; init; }
    public int? AltezzaPali { get; init; }
    public int? NumeroDoghe { get; init; }
    public int? NumeroSezioni { get; init; }
    public string? SezioniJson { get; init; }
}

public record ModificaOrdineRequest
{
    public string? FattRagSoc { get; init; }
    public string? FattIndirizzo { get; init; }
    public string? FattCap { get; init; }
    public string? FattCitta { get; init; }
    public string? FattProvincia { get; init; }
    public string? FattPIva { get; init; }
    public string? FattCFis { get; init; }
    public string? ConsRagSoc { get; init; }
    public string? ConsIndirizzo { get; init; }
    public string? ConsCap { get; init; }
    public string? ConsCitta { get; init; }
    public string? ConsProvincia { get; init; }
    public string? PagCod { get; init; }
    public string? PagDescrizione { get; init; }
    public string? Note { get; init; }
    public List<ModificaRigaDto>? RigheModificate { get; init; }
}

public record ModificaRigaDto
{
    public int RigaNum { get; init; }
    public decimal? Quantita { get; init; }
}