using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;
using ClosedXML.Excel;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/import")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly AppDbContext _db;

    public ImportController(AppDbContext db) => _db = db;

    private bool IsAdmin() => User.FindFirst("UserType")?.Value == "1";

    /// <summary>
    /// Import Prodotti (con supporto traduzioni PrdDes_EN, PrdDes_FR, PrdDes_DE)
    /// </summary>
    [HttpPost("prodotti")]
    public async Task<IActionResult> ImportProdotti(IFormFile file, [FromQuery] string mode = "merge")
    {
        if (!IsAdmin()) return Forbid();
        return await ImportGeneric(file, mode, ImportProdottiRows);
    }

    /// <summary>
    /// Import Prezzi
    /// </summary>
    [HttpPost("prezzi")]
    public async Task<IActionResult> ImportPrezzi(IFormFile file, [FromQuery] string mode = "merge")
    {
        if (!IsAdmin()) return Forbid();
        return await ImportGeneric(file, mode, ImportPrezziRows);
    }

    /// <summary>
    /// Import Clienti
    /// </summary>
    [HttpPost("clienti")]
    public async Task<IActionResult> ImportClienti(IFormFile file, [FromQuery] string mode = "merge")
    {
        if (!IsAdmin()) return Forbid();
        return await ImportGeneric(file, mode, ImportClientiRows);
    }

    /// <summary>
    /// Import Punti di Vendita
    /// </summary>
    [HttpPost("puntivendita")]
    public async Task<IActionResult> ImportPuntiVendita(IFormFile file, [FromQuery] string mode = "merge")
    {
        if (!IsAdmin()) return Forbid();
        return await ImportGeneric(file, mode, ImportPuntiVenditaRows);
    }

    // ======== Metodo generico di import ========
    private async Task<IActionResult> ImportGeneric(
        IFormFile file, string mode, Func<IXLWorksheet, string, Task<ImportResult>> importFunc)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse(false, "File non fornito"));

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheet(1);

        var result = await importFunc(ws, mode);
        return Ok(result);
    }

    // ======== Prodotti ========
    private async Task<ImportResult> ImportProdottiRows(IXLWorksheet ws, string mode)
    {
        var errori = new List<ImportError>();
        int imported = 0, total = 0;

        // Cerca header per traduzioni
        var headerRow = ws.Row(1);
        int? colEn = FindColumn(headerRow, "PrdDes_EN");
        int? colFr = FindColumn(headerRow, "PrdDes_FR");
        int? colDe = FindColumn(headerRow, "PrdDes_DE");

        if (mode == "replace")
        {
            _db.ProdottiTrad.RemoveRange(_db.ProdottiTrad);
            _db.Prezzi.RemoveRange(_db.Prezzi); // cascade consideration
            _db.Prodotti.RemoveRange(_db.Prodotti);
            await _db.SaveChangesAsync();
        }

        foreach (var row in ws.RangeUsed()!.RowsUsed().Skip(1))
        {
            total++;
            try
            {
                var prdCod = row.Cell(1).GetString().Trim();
                if (string.IsNullOrEmpty(prdCod)) { errori.Add(new ImportError(total + 1, "PrdCod", "Codice prodotto vuoto")); continue; }

                var existing = await _db.Prodotti.FindAsync(prdCod);
                if (existing != null && mode == "merge")
                {
                    existing.PrdDes = row.Cell(2).GetString();
                    existing.PrdUm = row.Cell(3).IsEmpty() ? existing.PrdUm : row.Cell(3).GetString();
                    existing.PosArc = row.Cell(4).IsEmpty() ? existing.PosArc : row.Cell(4).GetString();
                    existing.PrvCla = row.Cell(5).IsEmpty() ? existing.PrvCla : row.Cell(5).GetString();
                    existing.SitCod = row.Cell(6).IsEmpty() ? existing.SitCod : row.Cell(6).GetString();
                    existing.GrpCod = row.Cell(7).IsEmpty() ? existing.GrpCod : row.Cell(7).GetString();
                    existing.CatCod = row.Cell(8).IsEmpty() ? existing.CatCod : row.Cell(8).GetString();
                    existing.TreeCod = row.Cell(9).IsEmpty() ? existing.TreeCod : row.Cell(9).GetString();
                    existing.FamCod = row.Cell(10).IsEmpty() ? existing.FamCod : row.Cell(10).GetString();
                    existing.DiBaCod = row.Cell(11).IsEmpty() ? existing.DiBaCod : row.Cell(11).GetString();
                    existing.CfgTipo = row.Cell(12).IsEmpty() ? existing.CfgTipo : row.Cell(12).GetString();
                    existing.CfgColore = row.Cell(13).IsEmpty() ? existing.CfgColore : row.Cell(13).GetString();
                }
                else if (existing == null)
                {
                    _db.Prodotti.Add(new Prodotto
                    {
                        PrdCod = prdCod,
                        PrdDes = row.Cell(2).GetString(),
                        PrdUm = row.Cell(3).IsEmpty() ? null : row.Cell(3).GetString(),
                        PosArc = row.Cell(4).IsEmpty() ? null : row.Cell(4).GetString(),
                        PrvCla = row.Cell(5).IsEmpty() ? null : row.Cell(5).GetString(),
                        SitCod = row.Cell(6).IsEmpty() ? null : row.Cell(6).GetString(),
                        GrpCod = row.Cell(7).IsEmpty() ? null : row.Cell(7).GetString(),
                        CatCod = row.Cell(8).IsEmpty() ? null : row.Cell(8).GetString(),
                        TreeCod = row.Cell(9).IsEmpty() ? null : row.Cell(9).GetString(),
                        FamCod = row.Cell(10).IsEmpty() ? null : row.Cell(10).GetString(),
                        DiBaCod = row.Cell(11).IsEmpty() ? null : row.Cell(11).GetString(),
                        CfgTipo = row.Cell(12).IsEmpty() ? null : row.Cell(12).GetString(),
                        CfgColore = row.Cell(13).IsEmpty() ? null : row.Cell(13).GetString()
                    });
                }

                await _db.SaveChangesAsync();

                // Traduzioni
                await UpsertTraduzione(prdCod, "en", colEn.HasValue ? row.Cell(colEn.Value).GetString() : null);
                await UpsertTraduzione(prdCod, "fr", colFr.HasValue ? row.Cell(colFr.Value).GetString() : null);
                await UpsertTraduzione(prdCod, "de", colDe.HasValue ? row.Cell(colDe.Value).GetString() : null);

                imported++;
            }
            catch (Exception ex) { errori.Add(new ImportError(total + 1, "Row", ex.Message)); }
        }

        await _db.SaveChangesAsync();
        return new ImportResult(total, imported, errori.Count, errori);
    }

    private async Task UpsertTraduzione(string prdCod, string lang, string? des)
    {
        if (string.IsNullOrWhiteSpace(des)) return;

        var existing = await _db.ProdottiTrad.FindAsync(prdCod, lang);
        if (existing != null)
            existing.PrdDes = des;
        else
            _db.ProdottiTrad.Add(new ProdottoTrad { PrdCod = prdCod, LangCode = lang, PrdDes = des });
    }

    // ======== Prezzi ========
    private async Task<ImportResult> ImportPrezziRows(IXLWorksheet ws, string mode)
    {
        var errori = new List<ImportError>();
        int imported = 0, total = 0;

        if (mode == "replace") { _db.Prezzi.RemoveRange(_db.Prezzi); await _db.SaveChangesAsync(); }

        foreach (var row in ws.RangeUsed()!.RowsUsed().Skip(1))
        {
            total++;
            try
            {
                var prdCod = row.Cell(1).GetString().Trim();
                var lstCod = row.Cell(2).GetString().Trim();
                var prezzo = (decimal)row.Cell(3).GetDouble();

                var existing = await _db.Prezzi.FindAsync(prdCod, lstCod);
                if (existing != null)
                    existing.PrdPrz = prezzo;
                else
                    _db.Prezzi.Add(new Prezzo { PrdCod = prdCod, LstCod = lstCod, PrdPrz = prezzo });

                imported++;
            }
            catch (Exception ex) { errori.Add(new ImportError(total + 1, "Row", ex.Message)); }
        }
        await _db.SaveChangesAsync();
        return new ImportResult(total, imported, errori.Count, errori);
    }

    // ======== Clienti ========
    private async Task<ImportResult> ImportClientiRows(IXLWorksheet ws, string mode)
    {
        var errori = new List<ImportError>();
        int imported = 0, total = 0;

        if (mode == "replace") { _db.Clienti.RemoveRange(_db.Clienti); await _db.SaveChangesAsync(); }

        foreach (var row in ws.RangeUsed()!.RowsUsed().Skip(1))
        {
            total++;
            try
            {
                var itemId = row.Cell(1).GetString().Trim();
                var existing = await _db.Clienti.FindAsync(itemId);
                if (existing != null && mode == "merge")
                {
                    existing.ItemDes = row.Cell(2).GetString();
                    existing.PIva = row.Cell(3).IsEmpty() ? existing.PIva : row.Cell(3).GetString();
                    existing.CFis = row.Cell(4).IsEmpty() ? existing.CFis : row.Cell(4).GetString();
                    existing.Ind = row.Cell(5).IsEmpty() ? existing.Ind : row.Cell(5).GetString();
                    existing.Cap = row.Cell(6).IsEmpty() ? existing.Cap : row.Cell(6).GetString();
                    existing.Loc = row.Cell(7).IsEmpty() ? existing.Loc : row.Cell(7).GetString();
                    existing.Pro = row.Cell(8).IsEmpty() ? existing.Pro : row.Cell(8).GetString();
                    existing.LstCod = row.Cell(9).IsEmpty() ? existing.LstCod : row.Cell(9).GetString();
                    existing.LstCodPubb = row.Cell(10).IsEmpty() ? existing.LstCodPubb : row.Cell(10).GetString();
                    existing.PagCod = row.Cell(11).IsEmpty() ? existing.PagCod : row.Cell(11).GetString();
                }
                else if (existing == null)
                {
                    _db.Clienti.Add(new Cliente
                    {
                        ItemID = itemId,
                        ItemDes = row.Cell(2).GetString(),
                        PIva = row.Cell(3).IsEmpty() ? null : row.Cell(3).GetString(),
                        CFis = row.Cell(4).IsEmpty() ? null : row.Cell(4).GetString(),
                        Ind = row.Cell(5).IsEmpty() ? null : row.Cell(5).GetString(),
                        Cap = row.Cell(6).IsEmpty() ? null : row.Cell(6).GetString(),
                        Loc = row.Cell(7).IsEmpty() ? null : row.Cell(7).GetString(),
                        Pro = row.Cell(8).IsEmpty() ? null : row.Cell(8).GetString(),
                        LstCod = row.Cell(9).IsEmpty() ? null : row.Cell(9).GetString(),
                        LstCodPubb = row.Cell(10).IsEmpty() ? null : row.Cell(10).GetString(),
                        PagCod = row.Cell(11).IsEmpty() ? null : row.Cell(11).GetString()
                    });
                }
                imported++;
            }
            catch (Exception ex) { errori.Add(new ImportError(total + 1, "Row", ex.Message)); }
        }
        await _db.SaveChangesAsync();
        return new ImportResult(total, imported, errori.Count, errori);
    }

    // ======== Punti di Vendita ========
    private async Task<ImportResult> ImportPuntiVenditaRows(IXLWorksheet ws, string mode)
    {
        var errori = new List<ImportError>();
        int imported = 0, total = 0;

        if (mode == "replace") { _db.PuntiDiVendita.RemoveRange(_db.PuntiDiVendita); await _db.SaveChangesAsync(); }

        foreach (var row in ws.RangeUsed()!.RowsUsed().Skip(1))
        {
            total++;
            try
            {
                var itemId = row.Cell(1).GetString().Trim();
                var itemIdSede = row.Cell(2).GetString().Trim();
                var existing = await _db.PuntiDiVendita.FindAsync(itemId, itemIdSede);
                if (existing != null && mode == "merge")
                {
                    existing.ItemDes = row.Cell(3).GetString();
                    existing.Ind = row.Cell(4).IsEmpty() ? existing.Ind : row.Cell(4).GetString();
                    existing.Cap = row.Cell(5).IsEmpty() ? existing.Cap : row.Cell(5).GetString();
                    existing.Loc = row.Cell(6).IsEmpty() ? existing.Loc : row.Cell(6).GetString();
                    existing.Pro = row.Cell(7).IsEmpty() ? existing.Pro : row.Cell(7).GetString();
                    existing.Reg = row.Cell(8).IsEmpty() ? existing.Reg : row.Cell(8).GetString();
                    existing.Naz = row.Cell(9).IsEmpty() ? existing.Naz : row.Cell(9).GetString();
                    existing.LstCod = row.Cell(10).IsEmpty() ? existing.LstCod : row.Cell(10).GetString();
                    existing.LstCodPubb = row.Cell(11).IsEmpty() ? existing.LstCodPubb : row.Cell(11).GetString();
                    existing.PagCod = row.Cell(12).IsEmpty() ? existing.PagCod : row.Cell(12).GetString();
                    existing.Tel = row.Cell(13).IsEmpty() ? existing.Tel : row.Cell(13).GetString();
                    existing.Mail = row.Cell(14).IsEmpty() ? existing.Mail : row.Cell(14).GetString();
                }
                else if (existing == null)
                {
                    _db.PuntiDiVendita.Add(new PuntoDiVendita
                    {
                        ItemID = itemId, ItemIDSede = itemIdSede,
                        ItemDes = row.Cell(3).GetString(),
                        Ind = row.Cell(4).IsEmpty() ? null : row.Cell(4).GetString(),
                        Cap = row.Cell(5).IsEmpty() ? null : row.Cell(5).GetString(),
                        Loc = row.Cell(6).IsEmpty() ? null : row.Cell(6).GetString(),
                        Pro = row.Cell(7).IsEmpty() ? null : row.Cell(7).GetString(),
                        Reg = row.Cell(8).IsEmpty() ? null : row.Cell(8).GetString(),
                        Naz = row.Cell(9).IsEmpty() ? null : row.Cell(9).GetString(),
                        LstCod = row.Cell(10).IsEmpty() ? null : row.Cell(10).GetString(),
                        LstCodPubb = row.Cell(11).IsEmpty() ? null : row.Cell(11).GetString(),
                        PagCod = row.Cell(12).IsEmpty() ? null : row.Cell(12).GetString(),
                        Tel = row.Cell(13).IsEmpty() ? null : row.Cell(13).GetString(),
                        Mail = row.Cell(14).IsEmpty() ? null : row.Cell(14).GetString()
                    });
                }
                imported++;
            }
            catch (Exception ex) { errori.Add(new ImportError(total + 1, "Row", ex.Message)); }
        }
        await _db.SaveChangesAsync();
        return new ImportResult(total, imported, errori.Count, errori);
    }

    // ======== Visualizzazione tabelle (read-only) ========
    [HttpGet("prodotti")]
    public async Task<IActionResult> GetProdotti([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!IsAdmin()) return Forbid();
        var query = _db.Prodotti.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.PrdCod.Contains(search) || (p.PrdDes ?? "").Contains(search));
        var total = await query.CountAsync();
        var data = await query.OrderBy(p => p.PrdCod).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { success = true, data, pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) } });
    }

    [HttpGet("prezzi")]
    public async Task<IActionResult> GetPrezzi([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!IsAdmin()) return Forbid();
        var query = _db.Prezzi.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.PrdCod.Contains(search) || p.LstCod.Contains(search));
        var total = await query.CountAsync();
        var data = await query.OrderBy(p => p.PrdCod).ThenBy(p => p.LstCod).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { success = true, data, pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) } });
    }

    [HttpGet("clienti")]
    public async Task<IActionResult> GetClienti([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!IsAdmin()) return Forbid();
        var query = _db.Clienti.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.ItemID.Contains(search) || (c.ItemDes ?? "").Contains(search));
        var total = await query.CountAsync();
        var data = await query.OrderBy(c => c.ItemID).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { success = true, data, pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) } });
    }

    [HttpGet("puntivendita")]
    public async Task<IActionResult> GetPuntiVendita([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!IsAdmin()) return Forbid();
        var query = _db.PuntiDiVendita.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.ItemID.Contains(search) || (p.ItemDes ?? "").Contains(search) || p.ItemIDSede.Contains(search));
        var total = await query.CountAsync();
        var data = await query.OrderBy(p => p.ItemID).ThenBy(p => p.ItemIDSede).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { success = true, data, pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) } });
    }

    // ======== Export Excel ========
    [HttpGet("prodotti/export")]
    public async Task<IActionResult> ExportProdotti()
    {
        if (!IsAdmin()) return Forbid();
        var items = await _db.Prodotti.OrderBy(p => p.PrdCod).ToListAsync();
        var trads = await _db.ProdottiTrad.ToListAsync();
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Prodotti");
        string[] h = { "PrdCod", "PrdDes", "PrdUm", "PosArc", "PrvCla", "SitCod", "GrpCod", "CatCod", "TreeCod", "FamCod", "DiBaCod", "CfgTipo", "CfgColore", "PrdDes_EN", "PrdDes_FR", "PrdDes_DE" };
        for (int c = 0; c < h.Length; c++) ws.Cell(1, c + 1).Value = h[c];
        for (int i = 0; i < items.Count; i++)
        {
            var p = items[i];
            ws.Cell(i + 2, 1).Value = p.PrdCod; ws.Cell(i + 2, 2).Value = p.PrdDes; ws.Cell(i + 2, 3).Value = p.PrdUm;
            ws.Cell(i + 2, 4).Value = p.PosArc; ws.Cell(i + 2, 5).Value = p.PrvCla; ws.Cell(i + 2, 6).Value = p.SitCod;
            ws.Cell(i + 2, 7).Value = p.GrpCod; ws.Cell(i + 2, 8).Value = p.CatCod; ws.Cell(i + 2, 9).Value = p.TreeCod;
            ws.Cell(i + 2, 10).Value = p.FamCod; ws.Cell(i + 2, 11).Value = p.DiBaCod;
            ws.Cell(i + 2, 12).Value = p.CfgTipo; ws.Cell(i + 2, 13).Value = p.CfgColore;
            ws.Cell(i + 2, 14).Value = trads.FirstOrDefault(t => t.PrdCod == p.PrdCod && t.LangCode == "en")?.PrdDes;
            ws.Cell(i + 2, 15).Value = trads.FirstOrDefault(t => t.PrdCod == p.PrdCod && t.LangCode == "fr")?.PrdDes;
            ws.Cell(i + 2, 16).Value = trads.FirstOrDefault(t => t.PrdCod == p.PrdCod && t.LangCode == "de")?.PrdDes;
        }
        var ms = new MemoryStream(); wb.SaveAs(ms); ms.Position = 0;
        return File(ms, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "prodotti_export.xlsx");
    }

    [HttpGet("prezzi/export")]
    public async Task<IActionResult> ExportPrezzi()
    {
        if (!IsAdmin()) return Forbid();
        var items = await _db.Prezzi.OrderBy(p => p.PrdCod).ThenBy(p => p.LstCod).ToListAsync();
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Prezzi");
        ws.Cell(1, 1).Value = "PrdCod"; ws.Cell(1, 2).Value = "LstCod"; ws.Cell(1, 3).Value = "PrdPrz";
        for (int i = 0; i < items.Count; i++)
        {
            ws.Cell(i + 2, 1).Value = items[i].PrdCod; ws.Cell(i + 2, 2).Value = items[i].LstCod; ws.Cell(i + 2, 3).Value = items[i].PrdPrz ?? 0;
        }
        var ms = new MemoryStream(); wb.SaveAs(ms); ms.Position = 0;
        return File(ms, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "prezzi_export.xlsx");
    }

    [HttpGet("clienti/export")]
    public async Task<IActionResult> ExportClienti()
    {
        if (!IsAdmin()) return Forbid();
        var items = await _db.Clienti.OrderBy(c => c.ItemID).ToListAsync();
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Clienti");
        string[] h = { "ItemID", "ItemDes", "PIva", "CFis", "Ind", "Cap", "Loc", "Pro", "LstCod", "LstCodPubb", "PagCod" };
        for (int c = 0; c < h.Length; c++) ws.Cell(1, c + 1).Value = h[c];
        for (int i = 0; i < items.Count; i++)
        {
            var cl = items[i];
            ws.Cell(i + 2, 1).Value = cl.ItemID; ws.Cell(i + 2, 2).Value = cl.ItemDes; ws.Cell(i + 2, 3).Value = cl.PIva;
            ws.Cell(i + 2, 4).Value = cl.CFis; ws.Cell(i + 2, 5).Value = cl.Ind; ws.Cell(i + 2, 6).Value = cl.Cap;
            ws.Cell(i + 2, 7).Value = cl.Loc; ws.Cell(i + 2, 8).Value = cl.Pro;
            ws.Cell(i + 2, 9).Value = cl.LstCod; ws.Cell(i + 2, 10).Value = cl.LstCodPubb; ws.Cell(i + 2, 11).Value = cl.PagCod;
        }
        var ms = new MemoryStream(); wb.SaveAs(ms); ms.Position = 0;
        return File(ms, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "clienti_export.xlsx");
    }

    [HttpGet("puntivendita/export")]
    public async Task<IActionResult> ExportPuntiVendita()
    {
        if (!IsAdmin()) return Forbid();
        var items = await _db.PuntiDiVendita.OrderBy(p => p.ItemID).ThenBy(p => p.ItemIDSede).ToListAsync();
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("PuntiVendita");
        string[] h = { "ItemID", "ItemIDSede", "ItemDes", "Ind", "Cap", "Loc", "Pro", "Reg", "Naz", "LstCod", "LstCodPubb", "PagCod", "Tel", "Mail" };
        for (int c = 0; c < h.Length; c++) ws.Cell(1, c + 1).Value = h[c];
        for (int i = 0; i < items.Count; i++)
        {
            var pv = items[i];
            ws.Cell(i + 2, 1).Value = pv.ItemID; ws.Cell(i + 2, 2).Value = pv.ItemIDSede; ws.Cell(i + 2, 3).Value = pv.ItemDes;
            ws.Cell(i + 2, 4).Value = pv.Ind; ws.Cell(i + 2, 5).Value = pv.Cap; ws.Cell(i + 2, 6).Value = pv.Loc;
            ws.Cell(i + 2, 7).Value = pv.Pro; ws.Cell(i + 2, 8).Value = pv.Reg; ws.Cell(i + 2, 9).Value = pv.Naz;
            ws.Cell(i + 2, 10).Value = pv.LstCod; ws.Cell(i + 2, 11).Value = pv.LstCodPubb; ws.Cell(i + 2, 12).Value = pv.PagCod;
            ws.Cell(i + 2, 13).Value = pv.Tel; ws.Cell(i + 2, 14).Value = pv.Mail;
        }
        var ms = new MemoryStream(); wb.SaveAs(ms); ms.Position = 0;
        return File(ms, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "puntivendita_export.xlsx");
    }

    // ======== Conteggi per dashboard ========
    [HttpGet("counts")]
    public async Task<IActionResult> GetCounts()
    {
        if (!IsAdmin()) return Forbid();
        return Ok(new
        {
            success = true,
            data = new
            {
                prodotti = await _db.Prodotti.CountAsync(),
                prezzi = await _db.Prezzi.CountAsync(),
                clienti = await _db.Clienti.CountAsync(),
                puntiVendita = await _db.PuntiDiVendita.CountAsync(),
                utenti = await _db.Utenti.CountAsync()
            }
        });
    }

    private static int? FindColumn(IXLRow headerRow, string name)
    {
        foreach (var cell in headerRow.CellsUsed())
            if (cell.GetString().Trim().Equals(name, StringComparison.OrdinalIgnoreCase))
                return cell.Address.ColumnNumber;
        return null;
    }
}
