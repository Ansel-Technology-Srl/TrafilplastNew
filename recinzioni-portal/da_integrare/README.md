# Fase 6 — EURITMO ORDERS + Servizio Email

## Contenuto del pacchetto

```
fase6-euritmo/
├── backend/
│   ├── Controllers/
│   │   └── OrdiniController.cs        ← Endpoint invio/download/preview (MERGE con esistente)
│   └── Services/
│       ├── EuritmoService.cs          ← SOSTITUISCE l'esistente
│       └── EmailService.cs            ← SOSTITUISCE l'esistente
├── frontend/
│   ├── src/components/
│   │   └── EuritmoPreviewModal.jsx    ← NUOVO componente
│   └── i18n-merge/
│       └── euritmo-keys.json          ← Chiavi i18n da MERGERE (IT/EN/FR/DE)
├── config/
│   └── appsettings-euritmo-section.json ← Sezioni da AGGIUNGERE ad appsettings.json
├── database/
│   └── 07_euritmo_config.sql          ← OPZIONALE: tabella config da DB
└── README.md                          ← Questo file
```

---

## Istruzioni di deploy

### 1. Backend — Sostituire/aggiungere file

**Sostituire:**
- `Services/EuritmoService.cs` → sostituisce il file esistente (197 righe → ~350 righe)
- `Services/EmailService.cs` → sostituisce il file esistente (80 righe → ~200 righe)

**Mergiare:**
- `Controllers/OrdiniController.cs` → Questo file contiene SOLO gli endpoint EURITMO.
  Se il controller esiste già, **aggiungi** i 3 nuovi metodi + i parametri DI al costruttore:
  - `PUT {ordNum}/invia` (sostituisce il metodo esistente)
  - `GET {ordNum}/euritmo` (NUOVO)
  - `GET {ordNum}/euritmo/preview` (NUOVO)
  - Aggiungi `EuritmoService` e `EmailService` al costruttore

### 2. Backend — Registrare i servizi in Program.cs

Aggiungere **prima** di `var app = builder.Build();`:

```csharp
builder.Services.AddScoped<EuritmoService>();
builder.Services.AddScoped<EmailService>();
```

### 3. Backend — Configurare appsettings.json

Aggiungere le due sezioni dal file `config/appsettings-euritmo-section.json`:

```json
{
  "Euritmo": {
    "IdEdiMittente": "PLACEHOLDER_MITTENTE",
    "QualificatoreMittente": "ZZ",
    "IdEdiDestinatario": "PLACEHOLDER_DESTINATARIO",
    "QualificatoreDestinatario": "ZZ",
    "FornitoreRagSoc": "Fornitore Recinzioni Srl",
    "FornitoreIndirizzo": "Via Industriale 1",
    "FornitoreCitta": "Padova",
    "FornitoreProvincia": "PD",
    "FornitoreCap": "35100",
    "FornitoreNazione": "IT",
    "FornitorePIva": "",
    "FornitoreTelefono": "",
    "FornitoreEmail": "ordini@fornitore.example.com",
    "GiorniConsegnaDefault": 7,
    "ArchivioPath": "wwwroot/euritmo"
  },
  "Smtp": {
    "Host": "smtp.tuoserver.com",
    "Port": 587,
    "Username": "noreply@tuodominio.it",
    "Password": "la-tua-password",
    "From": "noreply@portale-recinzioni.it",
    "FromName": "Portale Recinzioni",
    "UseSsl": true
  }
}
```

**NOTA Q3:** I valori `IdEdiMittente` e `IdEdiDestinatario` sono placeholder. Quando il cliente fornirà gli identificativi EDI reali (P.IVA o codice EAN GS1), basterà aggiornare questi valori e il relativo qualificatore (ZZ→VA per P.IVA, ZZ→14 per EAN) senza toccare il codice.

### 4. Backend — Creare cartella archivio

```bash
mkdir -p wwwroot/euritmo
```

Questa cartella verrà creata automaticamente dal servizio al primo utilizzo, ma è buona pratica crearla nel deploy.

### 5. Frontend — Aggiungere componente

Copiare `EuritmoPreviewModal.jsx` in `frontend/src/components/`.

### 6. Frontend — Mergiare chiavi i18n

Dal file `euritmo-keys.json`, prendere la sezione `euritmo` di ogni lingua e aggiungerla al rispettivo file:

- `it.euritmo` → `frontend/src/i18n/locales/it.json`
- `en.euritmo` → `frontend/src/i18n/locales/en.json`
- `fr.euritmo` → `frontend/src/i18n/locales/fr.json`
- `de.euritmo` → `frontend/src/i18n/locales/de.json`

**NON sovrascrivere** le altre sezioni già presenti nei file.

### 7. Frontend — Aggiornare OrdersPage.jsx

Aggiungere nella pagina ordini (suggerimento di integrazione):

```jsx
import EuritmoPreviewModal from '../components/EuritmoPreviewModal';

// Nello state del componente:
const [euritmoOrdNum, setEuritmoOrdNum] = useState(null);

// Nei pulsanti azione di ogni ordine confermato:
<button
  onClick={() => setEuritmoOrdNum(ordine.ordNum)}
  className="btn-secondary text-sm flex items-center gap-1"
>
  <FileText className="w-4 h-4" />
  {t('euritmo.previewEdi')}
</button>

{ordine.flagInvioFornitore && (
  <span className="text-xs text-green-600 flex items-center gap-1">
    <CheckCircle className="w-3 h-3" />
    {t('euritmo.sentAt', {
      date: new Date(ordine.dataInvioFornitore).toLocaleDateString(),
      time: new Date(ordine.dataInvioFornitore).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    })}
  </span>
)}

// In fondo al JSX, prima del </> di chiusura:
<EuritmoPreviewModal
  ordNum={euritmoOrdNum}
  isOpen={!!euritmoOrdNum}
  onClose={() => setEuritmoOrdNum(null)}
  onSent={() => loadOrders()} // ricarica la lista
/>
```

### 8. Database (OPZIONALE)

Se vuoi gestire la configurazione EDI da database anziché da appsettings.json, esegui lo script `07_euritmo_config.sql`. In quel caso dovrai anche modificare `EuritmoService.cs` per leggere da DB anziché da IConfiguration.

---

## Multilingua

La lingua è selezionata dall'utente nel Layout (vicino al pulsante logout) e gestita da react-i18next. Il componente `EuritmoPreviewModal` usa le chiavi `euritmo.*` che vengono tradotte automaticamente in base alla lingua corrente. Tutte le stringhe visibili (pulsanti, messaggi toast, badge stato, legenda record) sono tradotte in IT/EN/FR/DE.

---

## Checklist test

### Test EURITMO Service
- [ ] Genera file per ordine con 1 riga → verifica lunghezza record BGM=168, NAS=564, NAB=305, NAD=305, NAI=305, DTM=33, LIN=295, CNT=36
- [ ] Genera file per ordine con note → verifica record FTX presente (216 bytes)
- [ ] Genera file per ordine con pagamento → verifica record PAT presente (198 bytes)
- [ ] Verifica che le righe figlie (RigaPadre != null) NON compaiano nel file EDI
- [ ] Verifica che i campi numerici abbiano zeri a sinistra (es. quantità 1.000 → "000000000001000")
- [ ] Verifica che i campi alfanumerici siano padded a destra con spazi
- [ ] Verifica file archiviato in wwwroot/euritmo/ con nome corretto
- [ ] Re-generazione: il file viene sovrascritto

### Test Email Service
- [ ] Invio email con allegato .edi → verifica ricezione
- [ ] SMTP non raggiungibile → il file EDI viene comunque generato e archiviato
- [ ] SMTP non raggiungibile → FlagInvioFornitore rimane false
- [ ] Email contiene riepilogo ordine (numero, cliente, totale, consegna)
- [ ] Allegato .edi ha il nome corretto

### Test Endpoint
- [ ] `PUT /api/ordini/{ordNum}/invia` su ordine NON confermato → errore 400
- [ ] `PUT /api/ordini/{ordNum}/invia` su ordine confermato → genera + invia + aggiorna flag
- [ ] `GET /api/ordini/{ordNum}/euritmo` → download file .edi
- [ ] `GET /api/ordini/{ordNum}/euritmo/preview` → JSON con contenuto e stato invio
- [ ] Verifica autorizzazione: tipo 4 non può accedere a ordini di altri utenti

### Test Frontend
- [ ] Pulsante "Anteprima EDI" visibile solo per ordini confermati
- [ ] Modal: contenuto monospaced con record evidenziati per colore
- [ ] Modal: pulsante "Scarica .edi" funzionante
- [ ] Modal: pulsante "Invia al fornitore" con conferma
- [ ] Modal: dopo invio, badge verde "Inviato il ..."
- [ ] Modal: "Re-invia" chiede conferma diversa
- [ ] Toast di successo/errore
- [ ] Tutte le stringhe tradotte nelle 4 lingue (cambiare lingua dal Layout e verificare)

### Test Multilingua
- [ ] Cambiare lingua da IT→EN→FR→DE nel selettore del Layout
- [ ] Verificare che tutti i testi nel modal cambino correttamente
- [ ] Verificare che i toast cambino lingua
- [ ] Verificare il formato data nel badge "Inviato il ..." si adatti alla locale

---

## Conformità EURITMO ORDERS Release 25.1

Il file generato è conforme alla specifica GS1 Italy EURITMO ORDERS Release 25.1:
- Record a lunghezza fissa con padding corretto (spazi dx per AN, zeri sx per N)
- Campi decimali formato 12int+3dec
- Date formato CCYYMMDD
- Sequenza record: BGM → NAS → [CTA] → NAB → NAD → NAI → DTM → [FTX] → [PAT] → LIN* → CNT
- Solo righe padre nel file EDI (componenti esclusi)
- Mapping UM: PZ/CF→PCE, CM/MT/ML→MTR, KG→KGM
