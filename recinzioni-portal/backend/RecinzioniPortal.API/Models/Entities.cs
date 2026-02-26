using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecinzioniPortal.API.Models;

// ======================== CLIENTI ========================
[Table("Clienti")]
public class Cliente
{
    [Key]
    [StringLength(16)]
    public string ItemID { get; set; } = string.Empty;

    [StringLength(256)]
    public string? ItemDes { get; set; }

    [StringLength(16)]
    public string? PIva { get; set; }

    [StringLength(16)]
    public string? CFis { get; set; }

    // Indirizzo sede legale (fatturazione)
    [StringLength(256)]
    public string? Ind { get; set; }

    [StringLength(16)]
    public string? Cap { get; set; }

    [StringLength(128)]
    public string? Loc { get; set; }

    [StringLength(16)]
    public string? Pro { get; set; }

    [StringLength(32)]
    public string? LstCod { get; set; }

    [StringLength(32)]
    public string? LstCodPubb { get; set; }

    [StringLength(16)]
    public string? PagCod { get; set; }

    public ICollection<PuntoDiVendita> PuntiVendita { get; set; } = new List<PuntoDiVendita>();
}

// ======================== PUNTI DI VENDITA ========================
[Table("PuntiDiVendita")]
public class PuntoDiVendita
{
    [StringLength(16)]
    public string ItemID { get; set; } = string.Empty;

    [StringLength(16)]
    public string ItemIDSede { get; set; } = string.Empty;

    [StringLength(256)]
    public string? ItemDes { get; set; }

    [StringLength(256)]
    public string? Ind { get; set; }

    [StringLength(16)]
    public string? Cap { get; set; }

    [StringLength(128)]
    public string? Loc { get; set; }

    [StringLength(16)]
    public string? Pro { get; set; }

    [StringLength(32)]
    public string? Reg { get; set; }

    [StringLength(64)]
    public string? Naz { get; set; }

    [StringLength(32)]
    public string? LstCod { get; set; }

    [StringLength(32)]
    public string? LstCodPubb { get; set; }

    [StringLength(16)]
    public string? PagCod { get; set; }

    [StringLength(32)]
    public string? Tel { get; set; }

    [StringLength(64)]
    public string? Mail { get; set; }

    [ForeignKey("ItemID")]
    public Cliente? Cliente { get; set; }
}

// ======================== UTENTI ========================
[Table("Utenti")]
public class Utente
{
    [Key]
    public short UserID { get; set; }

    [StringLength(32)]
    public string? UserLogin { get; set; }

    [StringLength(128)]
    public string? Password { get; set; }

    [StringLength(64)]
    public string? UserName { get; set; }

    public byte? UserType { get; set; }

    [StringLength(64)]
    public string? MailAddress { get; set; }

    [StringLength(16)]
    public string? ItemID { get; set; }

    [StringLength(16)]
    public string? ItemIDSede { get; set; }
}

// ======================== PRODOTTI ========================
[Table("Prodotti")]
public class Prodotto
{
    [Key]
    [StringLength(32)]
    public string PrdCod { get; set; } = string.Empty;

    [StringLength(256)]
    public string? PrdDes { get; set; }

    [StringLength(8)]
    public string? PrdUm { get; set; }

    [StringLength(32)]
    public string? PosArc { get; set; }

    [StringLength(8)]
    public string? PrvCla { get; set; }

    [StringLength(32)]
    public string? SitCod { get; set; }

    [StringLength(32)]
    public string? GrpCod { get; set; }

    [StringLength(32)]
    public string? CatCod { get; set; }

    [StringLength(16)]
    public string? TreeCod { get; set; }

    [StringLength(32)]
    public string? FamCod { get; set; }

    [StringLength(32)]
    public string? DiBaCod { get; set; }

    /// <summary>
    /// Tipo di configurazione (es. "recinzione"). NULL = prodotto non configurabile.
    /// Determina quale form di configurazione aprire nel frontend.
    /// </summary>
    [StringLength(32)]
    public string? CfgTipo { get; set; }

    /// <summary>
    /// Codice colore del componente (es. "GR", "VE", "RO").
    /// Usato dalla distinta base per selezionare il prodotto corretto in base al colore scelto.
    /// </summary>
    [StringLength(16)]
    public string? CfgColore { get; set; }

    public ICollection<ProdottoTrad> Traduzioni { get; set; } = new List<ProdottoTrad>();
}

// ======================== TRADUZIONI PRODOTTI ========================
[Table("ProdottiTrad")]
public class ProdottoTrad
{
    [StringLength(32)]
    public string PrdCod { get; set; } = string.Empty;

    [StringLength(5)]
    public string LangCode { get; set; } = string.Empty;

    [StringLength(256)]
    public string? PrdDes { get; set; }

    [ForeignKey("PrdCod")]
    public Prodotto? Prodotto { get; set; }
}

// ======================== PREZZI ========================
[Table("Prezzi")]
public class Prezzo
{
    [StringLength(32)]
    public string PrdCod { get; set; } = string.Empty;

    [StringLength(32)]
    public string LstCod { get; set; } = string.Empty;

    [Column(TypeName = "decimal(19,6)")]
    public decimal? PrdPrz { get; set; }
}

// ======================== TESTATA LISTINI ========================
[Table("LstTst")]
public class ListinoTestata
{
    [StringLength(32)]
    public string LstCod { get; set; } = string.Empty;

    public DateTime ValidoDal { get; set; }
    public DateTime ValidoAl { get; set; }
}

// ======================== ORDINI/PREVENTIVI TESTATA ========================
[Table("OrdPrevTst")]
public class OrdineTestata
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int OrdNum { get; set; }

    public DateTime OrdData { get; set; } = DateTime.Now;

    [StringLength(16)]
    public string Stato { get; set; } = "Carrello";

    public short? UserID { get; set; }

    [StringLength(16)]
    public string? ItemID { get; set; }

    [StringLength(16)]
    public string? ItemIDSede { get; set; }

    // Fatturazione
    [StringLength(256)]
    public string? FattRagSoc { get; set; }
    [StringLength(256)]
    public string? FattIndirizzo { get; set; }
    [StringLength(16)]
    public string? FattCap { get; set; }
    [StringLength(128)]
    public string? FattCitta { get; set; }
    [StringLength(16)]
    public string? FattProvincia { get; set; }
    [StringLength(16)]
    public string? FattPIva { get; set; }
    [StringLength(16)]
    public string? FattCFis { get; set; }

    // Consegna
    [StringLength(256)]
    public string? ConsRagSoc { get; set; }
    [StringLength(256)]
    public string? ConsIndirizzo { get; set; }
    [StringLength(16)]
    public string? ConsCap { get; set; }
    [StringLength(128)]
    public string? ConsCitta { get; set; }
    [StringLength(16)]
    public string? ConsProvincia { get; set; }

    // Pagamento
    [StringLength(16)]
    public string? PagCod { get; set; }
    [StringLength(128)]
    public string? PagDescrizione { get; set; }

    [Column(TypeName = "decimal(19,2)")]
    public decimal Subtotale { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal AliquotaIVA { get; set; } = 22.00m;

    [Column(TypeName = "decimal(19,2)")]
    public decimal ImportoIVA { get; set; }

    [Column(TypeName = "decimal(19,2)")]
    public decimal Totale { get; set; }

    [StringLength(1000)]
    public string? Note { get; set; }

    public bool FlagConferma { get; set; }
    public bool FlagInvioFornitore { get; set; }
    public DateTime? DataInvioFornitore { get; set; }

    public ICollection<OrdineDettaglio> Righe { get; set; } = new List<OrdineDettaglio>();
}

// ======================== ORDINI/PREVENTIVI DETTAGLIO ========================
[Table("OrdPrevDett")]
public class OrdineDettaglio
{
    public int OrdNum { get; set; }
    public int RigaNum { get; set; }
    public int? RigaPadre { get; set; }

    [StringLength(32)]
    public string? PrdCod { get; set; }

    [StringLength(256)]
    public string? PrdDes { get; set; }

    [StringLength(8)]
    public string? PrdUm { get; set; }

    [Column(TypeName = "decimal(19,3)")]
    public decimal? Quantita { get; set; }

    [Column(TypeName = "decimal(19,6)")]
    public decimal? PrezzoUnitario { get; set; }

    [Column(TypeName = "decimal(19,2)")]
    public decimal? PrezzoTotale { get; set; }

    [ForeignKey("OrdNum")]
    public OrdineTestata? Testata { get; set; }
}

// ======================== CONFIG RECINZIONE ========================
[Table("OrdPrevConfig")]
public class OrdineConfig
{
    public int OrdNum { get; set; }
    public int RigaNum { get; set; }

    [StringLength(16)]
    public string? ColoreDoghe { get; set; }

    [StringLength(16)]
    public string? ColorePali { get; set; }

    public bool? StessoColore { get; set; } = true;

    [StringLength(16)]
    public string? Fissaggio { get; set; }

    [StringLength(16)]
    public string? TipoDoghe { get; set; }

    public int? AltezzaPali { get; set; }
    public int? NumeroDoghe { get; set; }
    public int? NumeroSezioni { get; set; }
    public string? SezioniJson { get; set; }
}

// ======================== REFRESH TOKEN ========================
[Table("RefreshTokens")]
public class RefreshToken
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TokenID { get; set; }
    public short UserID { get; set; }

    [StringLength(256)]
    public string Token { get; set; } = string.Empty;
    public DateTime Expires { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime? Revoked { get; set; }

    public bool IsExpired => DateTime.UtcNow >= Expires;
    public bool IsActive => Revoked == null && !IsExpired;

    [ForeignKey("UserID")]
    public Utente? Utente { get; set; }
}

// ======================== NOTIFICHE CONFIG ========================
[Table("NotificheConfig")]
public class NotificaConfig
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int NotificaID { get; set; }

    [StringLength(32)]
    public string Tipo { get; set; } = string.Empty;

    public string? Template { get; set; }

    [StringLength(256)]
    public string? Oggetto { get; set; }

    public bool Attiva { get; set; } = true;
}
