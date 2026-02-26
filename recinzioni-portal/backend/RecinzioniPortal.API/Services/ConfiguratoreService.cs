using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;

namespace RecinzioniPortal.API.Services;

public class ConfiguratoreService
{
    private readonly AppDbContext _db;

    // Tabella numero doghe per altezza/tipo (AF v1.5 §5.2)
    private static readonly Dictionary<int, (int Persiana, int Pieno)> TabellaDoghe = new()
    {
        { 100, (8, 9) },
        { 150, (12, 14) },
        { 185, (15, 17) },
        { 200, (16, 18) }
    };

    private static readonly int[] AltezzeValide = { 100, 150, 185, 200 };

    private static readonly Dictionary<string, string> MappaColori = new(StringComparer.OrdinalIgnoreCase)
    {
        { "#7B7B7B", "GR" },
        { "#2D5A27", "VE" },
        { "#8B4513", "RO" }
    };

    private static readonly Dictionary<int, string> MappaAngoli = new()
    {
        { 90,  "ACC-ANG-90" }
    };

    public ConfiguratoreService(AppDbContext db)
    {
        _db = db;
    }

    public ValidazioneSezioneResponse Valida(DistintaBaseRequest req)
    {
        if (!AltezzeValide.Contains(req.AltezzaPali))
            return new(false, "Altezza pali non valida. Valori ammessi: 100, 150, 185, 200 cm.", 10, 150, 20);

        if (req.TipoDoghe != "persiana" && req.TipoDoghe != "pieno")
            return new(false, "Tipo doghe non valido. Valori ammessi: persiana, pieno.", 10, 150, 20);

        if (req.Fissaggio != "cemento" && req.Fissaggio != "terreno")
            return new(false, "Tipo fissaggio non valido. Valori ammessi: cemento, terreno.", 10, 150, 20);

        if (req.Sezioni == null || req.Sezioni.Count == 0)
            return new(false, "Almeno una sezione è richiesta.", 10, 150, 20);

        if (req.Sezioni.Count > 20)
            return new(false, "Massimo 20 sezioni per recinzione.", 10, 150, 20);

        foreach (var (sez, i) in req.Sezioni.Select((s, i) => (s, i)))
        {
            if (sez.Lunghezza < 10 || sez.Lunghezza > 150)
                return new(false, $"Sezione {i + 1}: lunghezza deve essere tra 10 e 150 cm.", 10, 150, 20);

            if (sez.Angolo != 0 && sez.Angolo != 90)
                return new(false, $"Sezione {i + 1}: l'angolo deve essere 0° (in linea) o 90°.", 10, 150, 20);
        }

        return new(true, null, 10, 150, 20);
    }

    public async Task<DistintaBaseResponse> CalcolaDistintaBase(
        DistintaBaseRequest req, string itemId, string? itemIdSede)
    {
        var codColDoghe = GetCodiceColore(req.ColoreDoghe);
        var codColPali  = GetCodiceColore(req.ColorePali);

        int numSezioni = req.Sezioni.Count;
        int numPali    = numSezioni + 1;
        int numDoghePerSezione = GetNumeroDoghe(req.AltezzaPali, req.TipoDoghe);
        int numDoghe   = numDoghePerSezione * numSezioni;
        int numFissaggi = numPali;
        int numDistanziali = numDoghePerSezione * numSezioni;
        int numCappellotti = numPali;
        double lunghezzaTotale = req.Sezioni.Sum(s => s.Lunghezza);

        var angoli = req.Sezioni
            .Where(s => s.Angolo != 0)
            .GroupBy(s => NormalizzaAngolo((int)s.Angolo))
            .ToDictionary(g => g.Key, g => g.Count());

        // Cerca componenti dal DB usando DiBaCod + CfgColore
        // DiBaCod identifica il ruolo del componente nella distinta base
        // CfgColore permette di selezionare la variante colore corretta
        var componentiBom = new List<(string DiBaCod, string? Colore, string FallbackCodice, int Qty)>
        {
            ($"PAL-{req.AltezzaPali}", codColPali, $"PAL-{req.AltezzaPali}-{codColPali}", numPali),
            ("DOG-150", codColDoghe, $"DOG-150-{codColDoghe}", numDoghe),
            (req.Fissaggio == "cemento" ? "FIX-CEM" : "FIX-TER", null, req.Fissaggio == "cemento" ? "FIX-CEM-01" : "FIX-TER-01", numFissaggi),
            (req.TipoDoghe == "persiana" ? "DST-PER" : "DST-PIE", null, req.TipoDoghe == "persiana" ? "DST-PER-01" : "DST-PIE-01", numDistanziali),
            ("ACC-CAP", codColPali, $"ACC-CAP-{codColPali}", numCappellotti)
        };

        foreach (var (angolo, qty) in angoli)
        {
            var codAng = MappaAngoli.GetValueOrDefault(angolo, "ACC-ANG-90");
            componentiBom.Add(("ACC-ANG", null, codAng, qty));
        }

        // Risolvi i codici prodotto dal DB: cerca per DiBaCod + CfgColore
        var codiciProdotto = new List<(string Codice, int Qty)>();
        foreach (var (diBaCod, colore, fallback, qty) in componentiBom)
        {
            var prdCod = await RisolviProdottoBom(diBaCod, colore);
            codiciProdotto.Add((prdCod ?? fallback, qty));
        }

        var listinoCodice = await DeterminaListino(itemId, itemIdSede);
        var codiciDistinct = codiciProdotto.Select(c => c.Codice).Distinct().ToList();
        var prezzi = await RecuperaPrezzi(codiciDistinct, listinoCodice);
        var prodotti = await RecuperaProdotti(codiciDistinct);

        var componenti = new List<ComponenteDistinta>();
        foreach (var (codice, qty) in codiciProdotto)
        {
            var prezzo = prezzi.GetValueOrDefault(codice, 0m);
            componenti.Add(new ComponenteDistinta(
                PrdCod: codice,
                PrdDes: prodotti.GetValueOrDefault(codice, codice),
                PrdUm: "PZ",
                Quantita: qty,
                PrezzoUnitario: prezzo,
                PrezzoTotale: prezzo * qty
            ));
        }

        return new DistintaBaseResponse(
            Componenti: componenti,
            Totale: componenti.Sum(c => c.PrezzoTotale),
            Riepilogo: new RiepilogoDistinta(numSezioni, numPali, numDoghePerSezione, lunghezzaTotale)
        );
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    /// <summary>
    /// Cerca un prodotto nella tabella Prodotti per DiBaCod e CfgColore.
    /// Se il colore è specificato, cerca prima con colore esatto, poi senza colore.
    /// Restituisce il PrdCod del prodotto trovato, oppure null se non trovato.
    /// </summary>
    private async Task<string?> RisolviProdottoBom(string diBaCod, string? colore)
    {
        if (!string.IsNullOrEmpty(colore))
        {
            // Cerca prodotto con DiBaCod e colore specifico
            var conColore = await _db.Set<Prodotto>()
                .Where(p => p.DiBaCod == diBaCod && p.CfgColore == colore)
                .Select(p => p.PrdCod)
                .FirstOrDefaultAsync();

            if (conColore != null) return conColore;
        }

        // Cerca prodotto con DiBaCod senza vincolo colore (componente generico)
        var senzaColore = await _db.Set<Prodotto>()
            .Where(p => p.DiBaCod == diBaCod && (p.CfgColore == null || p.CfgColore == ""))
            .Select(p => p.PrdCod)
            .FirstOrDefaultAsync();

        return senzaColore;
    }

    private static string GetCodiceColore(string hex)
        => MappaColori.GetValueOrDefault(hex, "GR");

    private static int GetNumeroDoghe(int altezza, string tipo)
    {
        if (!TabellaDoghe.TryGetValue(altezza, out var entry)) return 12;
        return tipo == "persiana" ? entry.Persiana : entry.Pieno;
    }

    private static int NormalizzaAngolo(int angolo)
    {
        // Solo 0° (in linea) o 90° sono ammessi
        return angolo != 0 ? 90 : 0;
    }

    private async Task<string> DeterminaListino(string itemId, string? itemIdSede)
    {
        if (!string.IsNullOrEmpty(itemIdSede))
        {
            var lstCustom = $"{itemId}_{itemIdSede}";
            var existsCustom = await _db.Set<ListinoTestata>()
                .AnyAsync(l => l.LstCod == lstCustom
                    && l.ValidoDal <= DateTime.Today
                    && l.ValidoAl >= DateTime.Today);
            if (existsCustom) return lstCustom;
        }

        var cliente = await _db.Set<Cliente>().FindAsync(itemId);

        if (cliente?.LstCod != null)
        {
            var exists = await _db.Set<ListinoTestata>()
                .AnyAsync(l => l.LstCod == cliente.LstCod
                    && l.ValidoDal <= DateTime.Today
                    && l.ValidoAl >= DateTime.Today);
            if (exists) return cliente.LstCod;
        }

        if (cliente?.LstCodPubb != null)
        {
            var exists = await _db.Set<ListinoTestata>()
                .AnyAsync(l => l.LstCod == cliente.LstCodPubb
                    && l.ValidoDal <= DateTime.Today
                    && l.ValidoAl >= DateTime.Today);
            if (exists) return cliente.LstCodPubb;
        }

        return "LSTPUB001";
    }

    private async Task<Dictionary<string, decimal>> RecuperaPrezzi(List<string> codici, string lstCod)
    {
        var prezzi = await _db.Set<Prezzo>()
            .Where(p => codici.Contains(p.PrdCod) && p.LstCod == lstCod)
            .ToDictionaryAsync(p => p.PrdCod, p => p.PrdPrz ?? 0m);

        var mancanti = codici.Except(prezzi.Keys).ToList();
        if (mancanti.Any() && lstCod != "LSTPUB001")
        {
            var fallback = await _db.Set<Prezzo>()
                .Where(p => mancanti.Contains(p.PrdCod) && p.LstCod == "LSTPUB001")
                .ToDictionaryAsync(p => p.PrdCod, p => p.PrdPrz ?? 0m);
            foreach (var kv in fallback)
                prezzi[kv.Key] = kv.Value;
        }

        return prezzi;
    }

    private async Task<Dictionary<string, string>> RecuperaProdotti(List<string> codici)
    {
        return await _db.Set<Prodotto>()
            .Where(p => codici.Contains(p.PrdCod))
            .ToDictionaryAsync(p => p.PrdCod, p => p.PrdDes ?? p.PrdCod);
    }

    // ─── Metodi statici pubblici ────────────────────────────────────────

    public static Dictionary<int, (int Persiana, int Pieno)> GetTabellaDoghe() => TabellaDoghe;
    public static int[] GetAltezzeValide() => AltezzeValide;
    public static Dictionary<string, string> GetColoriDisponibili() => new()
    {
        { "#7B7B7B", "Grigio" },
        { "#2D5A27", "Verde" },
        { "#8B4513", "Rosso mattone" }
    };

    /// <summary>
    /// Restituisce l'elenco dei tipi di configurazione disponibili nel sistema.
    /// </summary>
    public async Task<List<string>> GetTipiConfigurazione()
    {
        return await _db.Set<Prodotto>()
            .Where(p => p.CfgTipo != null && p.CfgTipo != "")
            .Select(p => p.CfgTipo!)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
    }
}
