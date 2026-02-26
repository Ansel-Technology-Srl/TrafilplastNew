namespace RecinzioniPortal.API.DTOs;

// ======================== AUTH ========================
public record LoginRequest(string Username, string Password, bool RememberMe = false);

public record LoginResponse(
    string Token,
    string RefreshToken,
    UserDto User
);

public record RefreshTokenRequest(string RefreshToken);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

// ======================== USER ========================
public record UserDto(
    short UserID,
    string? UserLogin,
    string? UserName,
    byte? UserType,
    string? MailAddress,
    string? ItemID,
    string? ItemIDSede
);

public record CreateUserRequest(
    short UserID,
    string UserLogin,
    string Password,
    string UserName,
    byte UserType,
    string? MailAddress,
    string? ItemID,
    string? ItemIDSede
);

public record UpdateUserRequest(
    string? UserLogin,
    string? Password,
    string? UserName,
    byte? UserType,
    string? MailAddress,
    string? ItemID,
    string? ItemIDSede
);

// ======================== PRODOTTI ========================
public record ProdottoDto(
    string PrdCod,
    string? PrdDes,
    string? PrdUm,
    string? CatCod,
    string? FamCod,
    string? GrpCod,
    decimal? Prezzo
);

// ======================== ORDINI ========================
public record OrdineTestataDtoRead(
    int OrdNum,
    DateTime OrdData,
    string Stato,
    string? FattRagSoc,
    decimal Subtotale,
    decimal ImportoIVA,
    decimal Totale,
    bool FlagConferma,
    bool FlagInvioFornitore,
    string? UserName
);

public record SavePreventivoRequest(
    string FattRagSoc,
    string FattIndirizzo,
    string? FattCap,
    string? FattCitta,
    string? FattProvincia,
    string? FattPIva,
    string? FattCFis,
    string? ConsRagSoc,
    string? ConsIndirizzo,
    string? ConsCap,
    string? ConsCitta,
    string? ConsProvincia,
    string? PagCod,
    string? PagDescrizione,
    string? Note,
    List<RigaOrdineRequest> Righe
);

public record RigaOrdineRequest(
    string PrdCod,
    string? PrdDes,
    string? PrdUm,
    decimal Quantita,
    decimal PrezzoUnitario,
    int? RigaPadre = null
);

// ======================== CONFIGURATORE (Fase 4) ========================

public record SezioneInput(
    double Lunghezza,       // 10-150 cm
    double Angolo = 0       // gradi rispetto alla sezione precedente (0 = dritto)
);

public record DistintaBaseRequest(
    int AltezzaPali,            // 100, 150, 185, 200
    string TipoDoghe,           // "persiana" | "pieno"
    string Fissaggio,           // "cemento" | "terreno"
    string ColoreDoghe,         // hex es. "#7B7B7B"
    string ColorePali,          // hex es. "#7B7B7B"
    List<SezioneInput> Sezioni
);

public record ComponenteDistinta(
    string PrdCod,
    string PrdDes,
    string PrdUm,
    int Quantita,
    decimal PrezzoUnitario,
    decimal PrezzoTotale
);

public record RiepilogoDistinta(
    int NumSezioni,
    int NumPali,
    int NumDoghePerSezione,
    double LunghezzaTotale
);

public record DistintaBaseResponse(
    List<ComponenteDistinta> Componenti,
    decimal Totale,
    RiepilogoDistinta Riepilogo
);

public record ValidazioneSezioneResponse(
    bool IsValid,
    string? Errore,
    double LunghezzaMinima,
    double LunghezzaMassima,
    int MaxSezioni
);

// ======================== IMPORT ========================
public record ImportResult(
    int TotaleRighe,
    int RigheImportate,
    int RigheErrore,
    List<ImportError> Errori
);

public record ImportError(int Riga, string Campo, string Messaggio);

// ======================== LISTINI ========================
public record ListinoRigaDto(
    string PrdCod,
    string? PrdDes,
    string? PrdUm,
    decimal? PrdPrz
);

public record UpdatePrezzoRequest(string PrdCod, decimal NuovoPrezzo);

public record CreaListinoRequest(DateTime ValidoDal, DateTime ValidoAl);

// ======================== API RESPONSE ========================
public record ApiResponse<T>(bool Success, string? Message, T? Data);
public record ApiResponse(bool Success, string? Message);