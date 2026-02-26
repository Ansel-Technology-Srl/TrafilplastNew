using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProdottiController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProdottiController(AppDbContext db) => _db = db;

    // ================================================================
    // Helper: determina il listino corrente per l'utente loggato
    // Logica AF §4.5: listino PdV personalizzato (se valido) > listino pubblico cliente
    // ================================================================
    private async Task<string?> GetListinoCorrente()
    {
        var itemId = User.FindFirst("ItemID")?.Value;
        var itemIdSede = User.FindFirst("ItemIDSede")?.Value;

        if (string.IsNullOrEmpty(itemId) || string.IsNullOrEmpty(itemIdSede))
            return null;

        var pdv = await _db.PuntiDiVendita
            .FirstOrDefaultAsync(p => p.ItemID == itemId && p.ItemIDSede == itemIdSede);

        if (pdv == null) return null;

        // Priorità 1: listino personalizzato PdV con date valide
        var lstCodPdv = $"{itemId}_{itemIdSede}";
        var oggi = DateTime.Today;
        var haListinoCustomValido = await _db.ListiniTestata
            .AnyAsync(l => l.LstCod == lstCodPdv
                && l.ValidoDal <= oggi
                && l.ValidoAl >= oggi);

        if (haListinoCustomValido)
            return lstCodPdv;

        // Priorità 2: listino del PdV (se diverso dal custom)
        if (!string.IsNullOrEmpty(pdv.LstCod))
        {
            var lstPdvValido = await _db.ListiniTestata
                .AnyAsync(l => l.LstCod == pdv.LstCod
                    && l.ValidoDal <= oggi
                    && l.ValidoAl >= oggi);
            if (lstPdvValido)
                return pdv.LstCod;
        }

        // Priorità 3: listino pubblico del cliente
        if (!string.IsNullOrEmpty(pdv.LstCodPubb))
            return pdv.LstCodPubb;

        // Fallback: listino standard dalla tabella Clienti
        var cliente = await _db.Clienti.FirstOrDefaultAsync(c => c.ItemID == itemId);
        return cliente?.LstCodPubb ?? cliente?.LstCod;
    }

    /// <summary>
    /// Elenco prodotti con prezzo dal listino dell'utente.
    /// Supporta: paginazione server-side, filtri categoria/famiglia/gruppo, ricerca, multilingua.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? lang,
        [FromQuery] string? catCod,
        [FromQuery] string? famCod,
        [FromQuery] string? grpCod,
        [FromQuery] string? search,
        [FromQuery] string? prdUm,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        // Limita pageSize
        if (pageSize < 1) pageSize = 24;
        if (pageSize > 100) pageSize = 100;
        if (page < 1) page = 1;

        var lstCod = await GetListinoCorrente();

        var query = _db.Prodotti.AsQueryable();

        // Filtri
        if (!string.IsNullOrEmpty(catCod))
            query = query.Where(p => p.CatCod == catCod);
        if (!string.IsNullOrEmpty(famCod))
            query = query.Where(p => p.FamCod == famCod);
        if (!string.IsNullOrEmpty(grpCod))
            query = query.Where(p => p.GrpCod == grpCod);
        if (!string.IsNullOrEmpty(prdUm))
            query = query.Where(p => p.PrdUm == prdUm);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                (p.PrdDes ?? "").Contains(search) ||
                p.PrdCod.Contains(search));

        // Solo prodotti con prezzo nel listino (se listino definito)
        // Nota: se non c'è listino, mostra tutti i prodotti senza prezzo
        // L'utente potrebbe voler vedere tutti i prodotti o solo quelli con prezzo
        // Per ora mostriamo tutti, il prezzo sarà null per quelli senza listino

        var total = await query.CountAsync();

        // Sorting
        query = (sortBy?.ToLower(), sortDir?.ToLower()) switch
        {
            ("code", "desc") => query.OrderByDescending(p => p.PrdCod),
            ("desc", "asc") => query.OrderBy(p => p.PrdDes),
            ("desc", "desc") => query.OrderByDescending(p => p.PrdDes),
            ("cat", "asc") => query.OrderBy(p => p.CatCod).ThenBy(p => p.PrdDes),
            ("cat", "desc") => query.OrderByDescending(p => p.CatCod).ThenBy(p => p.PrdDes),
            _ => query.OrderBy(p => p.PrdCod) // default: codice asc
        };

        var prodotti = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.PrdCod,
                PrdDes = !string.IsNullOrEmpty(lang) && lang != "it"
                    ? _db.ProdottiTrad
                        .Where(t => t.PrdCod == p.PrdCod && t.LangCode == lang)
                        .Select(t => t.PrdDes)
                        .FirstOrDefault() ?? p.PrdDes
                    : p.PrdDes,
                p.PrdUm,
                p.CatCod,
                p.FamCod,
                p.GrpCod,
                p.TreeCod,
                p.DiBaCod,
                p.CfgTipo,
                p.CfgColore,
                // Flag prodotto configurabile: ha un tipo di configurazione assegnato
                IsConfigurabile = !string.IsNullOrEmpty(p.CfgTipo),
                Prezzo = lstCod != null
                    ? _db.Prezzi
                        .Where(pr => pr.PrdCod == p.PrdCod && pr.LstCod == lstCod)
                        .Select(pr => (decimal?)pr.PrdPrz)
                        .FirstOrDefault()
                    : (decimal?)null
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = prodotti,
            pagination = new
            {
                page,
                pageSize,
                total,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            },
            listino = lstCod
        });
    }

    /// <summary>
    /// Dettaglio prodotto con tutte le info, traduzioni e prezzo
    /// </summary>
    [HttpGet("{prdCod}")]
    public async Task<IActionResult> GetById(string prdCod, [FromQuery] string? lang)
    {
        var prodotto = await _db.Prodotti
            .Include(p => p.Traduzioni)
            .FirstOrDefaultAsync(p => p.PrdCod == prdCod);

        if (prodotto == null)
            return NotFound(new ApiResponse(false, "Prodotto non trovato"));

        // Descrizione multilingua
        string? descrizione = prodotto.PrdDes;
        if (!string.IsNullOrEmpty(lang) && lang != "it")
        {
            var trad = prodotto.Traduzioni?.FirstOrDefault(t => t.LangCode == lang);
            if (trad != null) descrizione = trad.PrdDes;
        }

        // Prezzo dal listino utente
        var lstCod = await GetListinoCorrente();
        decimal? prezzo = null;
        if (!string.IsNullOrEmpty(lstCod))
        {
            prezzo = await _db.Prezzi
                .Where(pr => pr.PrdCod == prdCod && pr.LstCod == lstCod)
                .Select(pr => (decimal?)pr.PrdPrz)
                .FirstOrDefaultAsync();
        }

        // Traduzioni disponibili
        var traduzioni = prodotto.Traduzioni?
            .ToDictionary(t => t.LangCode ?? "", t => t.PrdDes ?? "") ?? new();

        return Ok(new ApiResponse<object>(true, null, new
        {
            prodotto.PrdCod,
            PrdDes = descrizione,
            PrdDesOriginale = prodotto.PrdDes,
            prodotto.PrdUm,
            prodotto.PosArc,
            prodotto.PrvCla,
            prodotto.SitCod,
            prodotto.GrpCod,
            prodotto.CatCod,
            prodotto.TreeCod,
            prodotto.FamCod,
            prodotto.DiBaCod,
            prodotto.CfgTipo,
            prodotto.CfgColore,
            IsConfigurabile = !string.IsNullOrEmpty(prodotto.CfgTipo),
            Prezzo = prezzo,
            Listino = lstCod,
            Traduzioni = traduzioni
        }));
    }

    /// <summary>
    /// Categorie distinte per filtro catalogo (con conteggio prodotti)
    /// </summary>
    [HttpGet("filtri/categorie")]
    public async Task<IActionResult> GetCategorie()
    {
        var cats = await _db.Prodotti
            .Where(p => p.CatCod != null && p.CatCod != "")
            .GroupBy(p => p.CatCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(c => c.codice)
            .ToListAsync();

        return Ok(new { success = true, data = cats });
    }

    /// <summary>
    /// Famiglie distinte per filtro catalogo (con conteggio prodotti)
    /// Opzionale: filtra per categoria
    /// </summary>
    [HttpGet("filtri/famiglie")]
    public async Task<IActionResult> GetFamiglie([FromQuery] string? catCod)
    {
        var query = _db.Prodotti
            .Where(p => p.FamCod != null && p.FamCod != "");

        if (!string.IsNullOrEmpty(catCod))
            query = query.Where(p => p.CatCod == catCod);

        var fam = await query
            .GroupBy(p => p.FamCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(f => f.codice)
            .ToListAsync();

        return Ok(new { success = true, data = fam });
    }

    /// <summary>
    /// Gruppi distinti per filtro catalogo (con conteggio prodotti)
    /// Opzionale: filtra per categoria e/o famiglia
    /// </summary>
    [HttpGet("filtri/gruppi")]
    public async Task<IActionResult> GetGruppi(
        [FromQuery] string? catCod,
        [FromQuery] string? famCod)
    {
        var query = _db.Prodotti
            .Where(p => p.GrpCod != null && p.GrpCod != "");

        if (!string.IsNullOrEmpty(catCod))
            query = query.Where(p => p.CatCod == catCod);
        if (!string.IsNullOrEmpty(famCod))
            query = query.Where(p => p.FamCod == famCod);

        var grp = await query
            .GroupBy(p => p.GrpCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(g => g.codice)
            .ToListAsync();

        return Ok(new { success = true, data = grp });
    }

    /// <summary>
    /// Tutti i filtri disponibili in un'unica chiamata (ottimizzazione)
    /// </summary>
    [HttpGet("filtri")]
    public async Task<IActionResult> GetAllFiltri()
    {
        var categorie = await _db.Prodotti
            .Where(p => p.CatCod != null && p.CatCod != "")
            .GroupBy(p => p.CatCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(c => c.codice)
            .ToListAsync();

        var famiglie = await _db.Prodotti
            .Where(p => p.FamCod != null && p.FamCod != "")
            .GroupBy(p => p.FamCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(f => f.codice)
            .ToListAsync();

        var gruppi = await _db.Prodotti
            .Where(p => p.GrpCod != null && p.GrpCod != "")
            .GroupBy(p => p.GrpCod!)
            .Select(g => new { codice = g.Key, count = g.Count() })
            .OrderBy(g => g.codice)
            .ToListAsync();

        var totaleProdotti = await _db.Prodotti.CountAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                categorie,
                famiglie,
                gruppi,
                totaleProdotti
            }
        });
    }
}
