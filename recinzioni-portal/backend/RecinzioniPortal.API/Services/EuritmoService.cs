using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.Models;
using System.Text;

namespace RecinzioniPortal.API.Services;

// ── Risultato generazione file EURITMO ──────────────────────────────────────
public record EuritmoResult(
    bool Success,
    string? FilePath,
    string? FileName,
    string? Content,
    string? Error
);

// ── Configurazione EDI da appsettings.json sezione "Euritmo" ────────────────
public class EuritmoConfig
{
    public string IdEdiMittente { get; set; } = "PLACEHOLDER_MITTENTE";
    public string QualificatoreMittente { get; set; } = "ZZ";
    public string IdEdiDestinatario { get; set; } = "PLACEHOLDER_DESTINATARIO";
    public string QualificatoreDestinatario { get; set; } = "ZZ";
    public string FornitoreRagSoc { get; set; } = "Fornitore Recinzioni Srl";
    public string FornitoreIndirizzo { get; set; } = "Via Industriale 1";
    public string FornitoreCitta { get; set; } = "Padova";
    public string FornitoreProvincia { get; set; } = "PD";
    public string FornitoreCap { get; set; } = "35100";
    public string FornitoreNazione { get; set; } = "IT";
    public string FornitorePIva { get; set; } = "";
    public string FornitoreTelefono { get; set; } = "";
    public string FornitoreEmail { get; set; } = "ordini@fornitore.example.com";
    public int GiorniConsegnaDefault { get; set; } = 7;
    public string ArchivioPath { get; set; } = "wwwroot/euritmo";
}

public class EuritmoService
{
    private readonly AppDbContext _db;
    private readonly EuritmoConfig _cfg;
    private readonly ILogger<EuritmoService> _log;
    private readonly IWebHostEnvironment _env;

    public EuritmoService(
        AppDbContext db,
        IConfiguration configuration,
        ILogger<EuritmoService> logger,
        IWebHostEnvironment env)
    {
        _db = db;
        _log = logger;
        _env = env;
        _cfg = new EuritmoConfig();
        configuration.GetSection("Euritmo").Bind(_cfg);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  METODO PRINCIPALE — Genera file EURITMO ORDERS Release 25.1
    // ════════════════════════════════════════════════════════════════════════
    public async Task<EuritmoResult> GeneraFileOrdine(int ordNum)
    {
        try
        {
            // 1. Carica testata ordine
            var ordine = await _db.OrdiniTestata.FirstOrDefaultAsync(o => o.OrdNum == ordNum);
            if (ordine == null)
                return Fail($"Ordine {ordNum} non trovato");

            // 2. Solo righe padre (componenti figli esclusi dal file EDI)
            var righe = await _db.OrdiniDettaglio
                .Where(r => r.OrdNum == ordNum && r.RigaPadre == null)
                .OrderBy(r => r.RigaNum)
                .ToListAsync();

            if (!righe.Any())
                return Fail($"Ordine {ordNum}: nessuna riga padre trovata");

            // 3. Dati anagrafici
            var cliente = await _db.Clienti.FirstOrDefaultAsync(c => c.ItemID == ordine.ItemID);
            var pdv = await _db.PuntiDiVendita
                .FirstOrDefaultAsync(p => p.ItemID == ordine.ItemID && p.ItemIDSede == ordine.ItemIDSede);

            // 4. Componi i record nell'ordine previsto dalla specifica
            var sb = new StringBuilder();

            sb.AppendLine(RecBGM(ordine));                                   // Testata documento
            sb.AppendLine(RecNAS());                                         // Fornitore
            if (HasContact()) sb.AppendLine(RecCTA());                       // Contatto fornitore
            sb.AppendLine(RecNAB(ordine, cliente));                          // Buyer
            sb.AppendLine(RecNAD(ordine, pdv));                              // Punto consegna
            sb.AppendLine(RecNAI(ordine));                                   // Intestatario fattura
            sb.AppendLine(RecDTM(ordine));                                   // Data consegna
            if (!string.IsNullOrWhiteSpace(ordine.Note))
                sb.AppendLine(RecFTX(ordine.Note));                          // Note
            if (!string.IsNullOrWhiteSpace(ordine.PagCod))
                sb.AppendLine(RecPAT(ordine));                               // Pagamento

            int n = 0;
            foreach (var r in righe) sb.AppendLine(RecLIN(r, ++n));          // Righe prodotto
            sb.AppendLine(RecCNT(n));                                        // Sommario

            string content = sb.ToString();
            string fileName = $"ORDERS_{ordNum}_{DateTime.Today:yyyyMMdd}.edi";

            // 5. Archivia su disco (best-effort: errori di I/O non bloccano la generazione)
            string? filePath = null;
            try
            {
                string dir = Path.Combine(_env.ContentRootPath, _cfg.ArchivioPath);
                Directory.CreateDirectory(dir);
                filePath = Path.Combine(dir, fileName);
                await File.WriteAllTextAsync(filePath, content, Encoding.ASCII);
            }
            catch (Exception fileEx)
            {
                _log.LogWarning(fileEx, "Impossibile archiviare file EURITMO su disco per ordine {Ord}", ordNum);
            }

            _log.LogInformation("EURITMO generato: {File} per ordine {Ord}", fileName, ordNum);
            return new EuritmoResult(true, filePath, fileName, content, null);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Errore generazione EURITMO ordine {Ord}", ordNum);
            return Fail($"Errore generazione: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  BUILDER RECORD — Uno per ogni tipo record della specifica
    // ════════════════════════════════════════════════════════════════════════

    // BGM — Testata documento (168 bytes)
    private string RecBGM(OrdineTestata o)
    {
        var s = new StringBuilder(168);
        s.Append(A("BGM", 3));
        s.Append(A(_cfg.IdEdiMittente, 35));
        s.Append(A(_cfg.QualificatoreMittente, 4));
        s.Append(A("", 14));                              // reverse routing mitt.
        s.Append(A(_cfg.IdEdiDestinatario, 35));
        s.Append(A(_cfg.QualificatoreDestinatario, 4));
        s.Append(A("", 14));                              // reverse routing dest.
        s.Append(A("ORDERS", 6));
        s.Append(A(o.OrdNum.ToString(), 35));
        s.Append(D(o.OrdData));
        s.Append(A(DateTime.Now.ToString("HHmm"), 4));
        s.Append(A("", 3));                               // CODAZION
        s.Append(A("", 3));                               // FILLER
        return Fix(s, 168);
    }

    // NAS — Fornitore/Supplier (564 bytes)
    private string RecNAS()
    {
        var s = new StringBuilder(564);
        s.Append(A("NAS", 3));
        bool hasPiva = !string.IsNullOrWhiteSpace(_cfg.FornitorePIva);
        s.Append(A(hasPiva ? _cfg.FornitorePIva : _cfg.IdEdiDestinatario, 17));
        s.Append(A(hasPiva ? "VA" : "ZZ", 3));
        s.Append(A(_cfg.FornitoreRagSoc, 70));
        s.Append(A(_cfg.FornitoreIndirizzo, 70));
        s.Append(A(_cfg.FornitoreCitta, 35));
        s.Append(A(_cfg.FornitoreProvincia, 9));
        s.Append(A(_cfg.FornitoreCap, 9));
        s.Append(A(_cfg.FornitoreNazione, 3));
        s.Append(A("", 345));
        return Fix(s, 564);
    }

    // CTA — Contatto fornitore (153 bytes)
    private string RecCTA()
    {
        var s = new StringBuilder(153);
        s.Append(A("CTA", 3));
        s.Append(A("OC", 3));
        s.Append(A(_cfg.FornitoreTelefono, 25));
        s.Append(A("", 25));  // FAX
        s.Append(A("", 25));  // TELEX
        s.Append(A(_cfg.FornitoreEmail, 70));
        s.Append(A("", 2));
        return Fix(s, 153);
    }

    // NAB — Buyer / Emittente ordine (305 bytes)
    private string RecNAB(OrdineTestata o, Cliente? c)
    {
        var s = new StringBuilder(305);
        s.Append(A("NAB", 3));
        string piva = c?.PIva ?? o.FattPIva ?? "";
        s.Append(A(piva, 17));
        s.Append(A(piva.Length > 0 ? "VA" : "ZZ", 3));
        s.Append(A(c?.ItemDes ?? o.FattRagSoc ?? "", 70));
        s.Append(A(o.FattIndirizzo, 70));
        s.Append(A(o.FattCitta, 35));
        s.Append(A(o.FattProvincia, 9));
        s.Append(A(o.FattCap, 9));
        s.Append(A("IT", 3));
        s.Append(A("", 86));
        return Fix(s, 305);
    }

    // NAD — Delivery Point / Punto consegna (305 bytes)
    private string RecNAD(OrdineTestata o, PuntoDiVendita? p)
    {
        var s = new StringBuilder(305);
        s.Append(A("NAD", 3));
        s.Append(A(o.FattPIva ?? p?.ItemIDSede ?? "", 17));
        s.Append(A("ZZ", 3));
        s.Append(A(Val(o.ConsRagSoc, p?.ItemDes), 70));
        s.Append(A(Val(o.ConsIndirizzo, p?.Ind), 70));
        s.Append(A(Val(o.ConsCitta, p?.Loc), 35));
        s.Append(A(Val(o.ConsProvincia, p?.Pro), 9));
        s.Append(A(Val(o.ConsCap, p?.Cap), 9));
        s.Append(A("IT", 3));
        s.Append(A("", 17));  // CODCONS2
        s.Append(A("", 3));   // QCODCONS2
        s.Append(A("", 66));
        return Fix(s, 305);
    }

    // NAI — Intestatario fattura (305 bytes)
    private string RecNAI(OrdineTestata o)
    {
        var s = new StringBuilder(305);
        s.Append(A("NAI", 3));
        string cf = o.FattPIva ?? "";
        s.Append(A(cf, 17));
        s.Append(A(cf.Length > 0 ? "VA" : "ZZ", 3));
        s.Append(A(o.FattRagSoc, 70));
        s.Append(A(o.FattIndirizzo, 70));
        s.Append(A(o.FattCitta, 35));
        s.Append(A(o.FattProvincia, 9));
        s.Append(A(o.FattCap, 9));
        s.Append(A("IT", 3));
        s.Append(A("", 86));
        return Fix(s, 305);
    }

    // DTM — Data consegna (33 bytes)
    private string RecDTM(OrdineTestata o)
    {
        var s = new StringBuilder(33);
        s.Append(A("DTM", 3));
        s.Append(D(o.OrdData.AddDays(_cfg.GiorniConsegnaDefault)));
        s.Append(A("", 4));      // ora
        s.Append(A("002", 3));   // 002 = data richiesta
        s.Append(A("", 8));      // DATCON2
        s.Append(A("", 4));      // ORACON2
        s.Append(A("", 3));      // TIPODAT2
        return Fix(s, 33);
    }

    // FTX — Note testata (216 bytes)
    private string RecFTX(string note)
    {
        var s = new StringBuilder(216);
        s.Append(A("FTX", 3));
        s.Append(A("AAI", 3));
        s.Append(A(note, 210));
        return Fix(s, 216);
    }

    // PAT — Termini pagamento (198 bytes)
    private string RecPAT(OrdineTestata o)
    {
        var s = new StringBuilder(198);
        s.Append(A("PAT", 3));
        s.Append(A("1", 3));    // base
        s.Append(A("5", 3));    // dalla data doc
        s.Append(A("D", 3));    // giorni
        s.Append(A("030", 3));  // 30gg default
        s.Append(A(o.PagDescrizione, 70));
        s.Append(A("", 113));
        return Fix(s, 198);
    }

    // LIN — Riga prodotto (295 bytes)
    private string RecLIN(OrdineDettaglio r, int n)
    {
        var s = new StringBuilder(295);
        s.Append(A("LIN", 3));
        s.Append(N(n, 6));                          // NUMRIGA
        s.Append(A("", 35));                         // CODEANCU
        s.Append(A("", 3));                          // TIPCODCU
        s.Append(A("", 35));                         // CODEANTU
        s.Append(A(r.PrdCod, 35));                   // CODFORTU
        s.Append(A("", 35));                         // CODDISTU
        s.Append(A(r.PrdDes, 35));                   // DESART
        s.Append(A("", 3));                          // FLINPROM
        s.Append(Dec(r.Quantita ?? 0, 12, 3));      // QTAORD
        string um = UM(r.PrdUm);
        s.Append(A(um, 3));                          // UDMQORD
        s.Append(Dec(r.PrezzoUnitario ?? 0, 12, 3)); // PRZUNI
        s.Append(A("AAA", 3));                       // TIPOPRZ
        s.Append(A(um, 3));                          // UDMPRZUN
        s.Append(A("", 5));                          // NRCUINTU
        s.Append(A("", 3));                          // CODAZIONR
        s.Append(A(r.PrdCod, 35));                   // CODARTBU
        s.Append(A("", 23));                         // FILLER
        return Fix(s, 295);
    }

    // CNT — Sommario (36 bytes)
    private string RecCNT(int tot)
    {
        var s = new StringBuilder(36);
        s.Append(A("CNT", 3));
        s.Append(N(tot, 6));
        s.Append(A("", 27));
        return Fix(s, 36);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  HELPER — Formattazione campi specifica EURITMO
    // ════════════════════════════════════════════════════════════════════════

    private static string A(string? v, int len)
    {
        string x = v ?? "";
        return x.Length > len ? x[..len] : x.PadRight(len);
    }

    private static string N(int v, int len)
        => v.ToString().PadLeft(len, '0')[..len];

    private static string Dec(decimal v, int iLen, int dLen)
    {
        if (v == 0) return new string(' ', iLen + dLen);
        long ip = (long)Math.Truncate(Math.Abs(v));
        long dp = (long)Math.Round((Math.Abs(v) - ip) * (decimal)Math.Pow(10, dLen));
        string si = ip.ToString().PadLeft(iLen, '0');
        string sd = dp.ToString().PadLeft(dLen, '0');
        if (si.Length > iLen) si = si[..iLen];
        if (sd.Length > dLen) sd = sd[..dLen];
        return si + sd;
    }

    private static string D(DateTime d) => d.ToString("yyyyMMdd");

    private static string UM(string? u) => (u?.ToUpperInvariant()) switch
    {
        "PZ" or "CF" => "PCE",
        "CM" or "MT" or "ML" => "MTR",
        "KG" => "KGM",
        _ => "PCE"
    };

    private static string Fix(StringBuilder sb, int len)
    {
        string r = sb.ToString();
        return r.Length > len ? r[..len] : r.PadRight(len);
    }

    private static string Val(string? ordVal, string? pdvVal)
        => !string.IsNullOrWhiteSpace(ordVal) ? ordVal : pdvVal ?? "";

    private bool HasContact()
        => !string.IsNullOrWhiteSpace(_cfg.FornitoreTelefono) ||
           !string.IsNullOrWhiteSpace(_cfg.FornitoreEmail);

    private static EuritmoResult Fail(string err)
        => new(false, null, null, null, err);

    // ════════════════════════════════════════════════════════════════════════
    //  METODI PUBBLICI ADDIZIONALI
    // ════════════════════════════════════════════════════════════════════════

    public string? GetArchivedFilePath(int ordNum)
    {
        string dir = Path.Combine(_env.ContentRootPath, _cfg.ArchivioPath);
        if (!Directory.Exists(dir)) return null;
        return Directory.GetFiles(dir, $"ORDERS_{ordNum}_*.edi")
            .OrderByDescending(f => f).FirstOrDefault();
    }

    public EuritmoConfig GetConfig() => _cfg;
}
