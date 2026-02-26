using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ListiniController : ControllerBase
{
    private readonly AppDbContext _db;

    public ListiniController(AppDbContext db) => _db = db;

    private bool IsSuperUser() => User.FindFirst("UserType")?.Value == "2";
    private string? GetItemID() => User.FindFirst("ItemID")?.Value;

    /// <summary>
    /// Punti vendita del cliente associato al Super User, con info listino
    /// </summary>
    [HttpGet("puntivendita")]
    public async Task<IActionResult> GetPuntiVenditaCliente()
    {
        if (!IsSuperUser()) return Forbid();
        var itemId = GetItemID();

        var pdvs = await _db.PuntiDiVendita
            .Where(p => p.ItemID == itemId)
            .ToListAsync();

        var result = new List<object>();
        foreach (var pdv in pdvs)
        {
            var lstCodCustom = $"{itemId}_{pdv.ItemIDSede}";
            var testataCustom = await _db.ListiniTestata
                .Where(l => l.LstCod == lstCodCustom)
                .OrderByDescending(l => l.ValidoAl)
                .FirstOrDefaultAsync();

            var numPrezziCustom = testataCustom != null
                ? await _db.Prezzi.CountAsync(p => p.LstCod == lstCodCustom)
                : 0;
            var numPrezziPubb = !string.IsNullOrEmpty(pdv.LstCodPubb)
                ? await _db.Prezzi.CountAsync(p => p.LstCod == pdv.LstCodPubb)
                : 0;

            result.Add(new
            {
                pdv.ItemID, pdv.ItemIDSede, pdv.ItemDes, pdv.Ind, pdv.Loc, pdv.Pro,
                pdv.LstCod, pdv.LstCodPubb,
                HasCustomList = testataCustom != null,
                CustomLstCod = lstCodCustom,
                CustomValidoDal = testataCustom?.ValidoDal,
                CustomValidoAl = testataCustom?.ValidoAl,
                CustomIsValid = testataCustom != null
                    && testataCustom.ValidoDal <= DateTime.Today
                    && testataCustom.ValidoAl >= DateTime.Today,
                NumPrezziCustom = numPrezziCustom,
                NumPrezziPubb = numPrezziPubb
            });
        }

        return Ok(new ApiResponse<object>(true, null, result));
    }

    /// <summary>
    /// Confronto prezzi: listino custom vs listino pubblico per un PdV
    /// </summary>
    [HttpGet("confronto/{itemIdSede}")]
    public async Task<IActionResult> GetConfronto(
        string itemIdSede,
        [FromQuery] string? search,
        [FromQuery] string? filter,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (!IsSuperUser()) return Forbid();
        var itemId = GetItemID();

        var pdv = await _db.PuntiDiVendita
            .FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == itemIdSede);
        if (pdv == null) return NotFound(new ApiResponse(false, "Punto vendita non trovato"));

        var lstCodCustom = $"{itemId}_{itemIdSede}";
        var lstCodPubb = pdv.LstCodPubb;

        if (string.IsNullOrEmpty(lstCodPubb))
            return BadRequest(new ApiResponse(false, "Listino pubblico non configurato"));

        // Prodotti nel listino pubblico
        var baseQuery = from pp in _db.Prezzi
                        join pr in _db.Prodotti on pp.PrdCod equals pr.PrdCod
                        where pp.LstCod == lstCodPubb
                        select new { pr, pp };

        if (!string.IsNullOrEmpty(search))
            baseQuery = baseQuery.Where(x =>
                x.pr.PrdCod.Contains(search) || (x.pr.PrdDes ?? "").Contains(search));

        var allItems = await baseQuery.OrderBy(x => x.pr.PrdCod).ToListAsync();

        var prezziCustom = await _db.Prezzi
            .Where(p => p.LstCod == lstCodCustom)
            .ToDictionaryAsync(p => p.PrdCod, p => p.PrdPrz);

        var rows = allItems.Select(x =>
        {
            var cp = prezziCustom.ContainsKey(x.pr.PrdCod) ? prezziCustom[x.pr.PrdCod] : null;
            var isModified = cp.HasValue && cp != x.pp.PrdPrz;
            return new
            {
                x.pr.PrdCod, x.pr.PrdDes, x.pr.PrdUm,
                PrezzoPubblico = x.pp.PrdPrz,
                PrezzoCustom = cp,
                IsModified = isModified,
                Differenza = cp.HasValue ? cp.Value - (x.pp.PrdPrz ?? 0) : 0,
                DiffPerc = x.pp.PrdPrz > 0 && cp.HasValue
                    ? Math.Round(((cp.Value - x.pp.PrdPrz.Value) / x.pp.PrdPrz.Value) * 100, 2) : 0m
            };
        }).ToList();

        if (filter == "modified") rows = rows.Where(r => r.IsModified).ToList();
        else if (filter == "unchanged") rows = rows.Where(r => !r.IsModified).ToList();

        var total = rows.Count;
        var modified = rows.Count(r => r.IsModified);
        var pagedRows = rows.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new
        {
            success = true, data = pagedRows,
            pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) },
            summary = new { total = rows.Count, modified, unchanged = rows.Count - modified }
        });
    }

    /// <summary>
    /// Visualizza il listino semplice (senza confronto)
    /// </summary>
    [HttpGet("{lstCod}")]
    public async Task<IActionResult> GetListino(string lstCod,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!IsSuperUser()) return Forbid();

        var query = from p in _db.Prezzi
                    join pr in _db.Prodotti on p.PrdCod equals pr.PrdCod
                    where p.LstCod == lstCod
                    select new { p, pr };

        if (!string.IsNullOrEmpty(search))
            query = query.Where(x => x.p.PrdCod.Contains(search) || (x.pr.PrdDes ?? "").Contains(search));

        var total = await query.CountAsync();
        var righe = await query.OrderBy(x => x.p.PrdCod)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.pr.PrdCod, x.pr.PrdDes, x.pr.PrdUm, x.p.PrdPrz })
            .ToListAsync();

        return Ok(new
        {
            success = true, data = righe,
            pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) }
        });
    }

    /// <summary>
    /// Crea listino personalizzato per un PdV duplicando il listino pubblico
    /// </summary>
    [HttpPost("crea/{itemIdSede}")]
    public async Task<IActionResult> CreaListinoPersonalizzato(string itemIdSede, [FromBody] CreaListinoRequest? req)
    {
        if (!IsSuperUser()) return Forbid();
        var itemId = GetItemID();

        var pdv = await _db.PuntiDiVendita
            .FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == itemIdSede);
        if (pdv == null) return NotFound(new ApiResponse(false, "Punto vendita non trovato"));

        if (string.IsNullOrEmpty(pdv.LstCodPubb))
            return BadRequest(new ApiResponse(false, "Listino pubblico non configurato per questo PdV"));

        var nuovoLstCod = $"{itemId}_{itemIdSede}";

        if (await _db.Prezzi.AnyAsync(p => p.LstCod == nuovoLstCod))
            return Conflict(new ApiResponse(false, "Esiste già un listino personalizzato per questo PdV"));

        var prezziPubb = await _db.Prezzi.Where(p => p.LstCod == pdv.LstCodPubb).ToListAsync();
        foreach (var p in prezziPubb)
            _db.Prezzi.Add(new Prezzo { PrdCod = p.PrdCod, LstCod = nuovoLstCod, PrdPrz = p.PrdPrz });

        var dal = req?.ValidoDal ?? DateTime.Today;
        var al = req?.ValidoAl ?? DateTime.Today.AddYears(1);
        _db.ListiniTestata.Add(new ListinoTestata { LstCod = nuovoLstCod, ValidoDal = dal, ValidoAl = al });

        pdv.LstCod = nuovoLstCod;
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<object>(true, "Listino personalizzato creato",
            new { LstCod = nuovoLstCod, PrezziCopiati = prezziPubb.Count, ValidoDal = dal, ValidoAl = al }));
    }

    /// <summary>
    /// Aggiorna prezzo singolo
    /// </summary>
    [HttpPut("{lstCod}/prezzo")]
    public async Task<IActionResult> UpdatePrezzo(string lstCod, [FromBody] UpdatePrezzoRequest req)
    {
        if (!IsSuperUser()) return Forbid();
        if (!lstCod.StartsWith($"{GetItemID()}_")) return Forbid();

        var prezzo = await _db.Prezzi.FindAsync(req.PrdCod, lstCod);
        if (prezzo == null) return NotFound(new ApiResponse(false, "Prodotto non trovato nel listino"));

        prezzo.PrdPrz = req.NuovoPrezzo;
        await _db.SaveChangesAsync();
        return Ok(new ApiResponse(true, "Prezzo aggiornato"));
    }

    /// <summary>
    /// Aggiorna date di validità
    /// </summary>
    [HttpPut("{lstCod}/validita")]
    public async Task<IActionResult> UpdateValidita(string lstCod, [FromBody] CreaListinoRequest req)
    {
        if (!IsSuperUser()) return Forbid();
        if (!lstCod.StartsWith($"{GetItemID()}_")) return Forbid();

        var testata = await _db.ListiniTestata
            .Where(l => l.LstCod == lstCod)
            .FirstOrDefaultAsync();
        if (testata == null) return NotFound(new ApiResponse(false, "Testata listino non trovata"));

        _db.ListiniTestata.Remove(testata);
        _db.ListiniTestata.Add(new ListinoTestata { LstCod = lstCod, ValidoDal = req.ValidoDal, ValidoAl = req.ValidoAl });
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse(true, "Date validità aggiornate"));
    }

    /// <summary>
    /// Elimina listino personalizzato (ripristina il pubblico)
    /// </summary>
    [HttpDelete("{lstCod}")]
    public async Task<IActionResult> DeleteListino(string lstCod)
    {
        if (!IsSuperUser()) return Forbid();
        var itemId = GetItemID();
        if (!lstCod.StartsWith($"{itemId}_")) return Forbid();

        _db.Prezzi.RemoveRange(await _db.Prezzi.Where(p => p.LstCod == lstCod).ToListAsync());
        _db.ListiniTestata.RemoveRange(await _db.ListiniTestata.Where(l => l.LstCod == lstCod).ToListAsync());

        var sede = lstCod.Substring(lstCod.IndexOf('_') + 1);
        var pdv = await _db.PuntiDiVendita.FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == sede);
        if (pdv != null) pdv.LstCod = pdv.LstCodPubb;

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse(true, "Listino personalizzato eliminato"));
    }

    /// <summary>
    /// Reset: riallinea tutti i prezzi custom al listino pubblico
    /// </summary>
    [HttpPost("{lstCod}/reset")]
    public async Task<IActionResult> ResetListino(string lstCod)
    {
        if (!IsSuperUser()) return Forbid();
        var itemId = GetItemID();
        if (!lstCod.StartsWith($"{itemId}_")) return Forbid();

        var sede = lstCod.Substring(lstCod.IndexOf('_') + 1);
        var pdv = await _db.PuntiDiVendita.FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == sede);
        if (pdv?.LstCodPubb == null) return BadRequest(new ApiResponse(false, "Listino pubblico non configurato"));

        var prezziPubb = await _db.Prezzi.Where(p => p.LstCod == pdv.LstCodPubb).ToDictionaryAsync(p => p.PrdCod, p => p.PrdPrz);
        var prezziCustom = await _db.Prezzi.Where(p => p.LstCod == lstCod).ToListAsync();

        int reset = 0;
        foreach (var pc in prezziCustom)
        {
            if (prezziPubb.ContainsKey(pc.PrdCod) && pc.PrdPrz != prezziPubb[pc.PrdCod])
            { pc.PrdPrz = prezziPubb[pc.PrdCod]; reset++; }
        }

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<object>(true, $"{reset} prezzi ripristinati", new { Reset = reset }));
    }
}
