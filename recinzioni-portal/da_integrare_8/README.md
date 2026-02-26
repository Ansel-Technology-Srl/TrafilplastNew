# Fase 8 — PWA + Deploy Produzione

Pacchetto per trasformare il Portale Recinzioni in una **Progressive Web App installabile** e ottimizzare il deploy su **IIS (Windows Server)**.

---

## Contenuto del pacchetto

```
fase8-pwa-deploy/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg              ← Icona SVG placeholder "RP"
│   │   ├── favicon.ico              ← 32x32
│   │   ├── apple-touch-icon.png     ← 180x180
│   │   ├── logo-192.png             ← 192x192
│   │   └── logo-512.png             ← 512x512
│   ├── src/
│   │   ├── main.jsx                 ← AGGIORNATO: registrazione service worker
│   │   ├── components/
│   │   │   ├── InstallPrompt.jsx    ← Banner "Installa l'app"
│   │   │   ├── UpdatePrompt.jsx     ← Banner "Aggiornamento disponibile"
│   │   │   └── OfflineBanner.jsx    ← Banner slim "Sei offline"
│   │   ├── pages/
│   │   │   └── OfflinePage.jsx      ← Pagina offline full-screen
│   │   └── hooks/
│   │       └── useOnlineStatus.js   ← Hook stato connessione
│   ├── i18n-merge/
│   │   └── pwa-keys.json           ← Traduzioni PWA (IT/EN/FR/DE)
│   ├── index.html                   ← AGGIORNATO: meta PWA + noscript
│   └── vite.config.js               ← AGGIORNATO: VitePWA + build optimization
├── backend/
│   ├── Controllers/
│   │   └── HealthController.cs      ← GET /api/health
│   ├── appsettings.Development.json ← Config sviluppo locale
│   ├── appsettings.Production.json  ← Template produzione (CHANGE_ME)
│   └── web.config                   ← Config IIS (compressione, cache, security)
├── scripts/
│   ├── deploy.ps1                   ← Deploy automatico Windows/IIS
│   └── deploy.sh                    ← Build locale Linux/Mac
└── README.md                        ← Questo file
```

---

## Istruzioni di integrazione

### 1. Installare la dipendenza PWA

```bash
cd frontend
npm install -D vite-plugin-pwa
```

Opzionale, per analisi bundle:
```bash
npm install -D rollup-plugin-visualizer
```

### 2. Sostituire/aggiungere file

| File del pacchetto | Azione | Destinazione nel progetto |
|---|---|---|
| `frontend/vite.config.js` | **SOSTITUIRE** | `frontend/vite.config.js` |
| `frontend/index.html` | **SOSTITUIRE** | `frontend/index.html` |
| `frontend/src/main.jsx` | **SOSTITUIRE** | `frontend/src/main.jsx` |
| `frontend/public/*` (icone) | **COPIARE** | `frontend/public/` |
| `frontend/src/components/InstallPrompt.jsx` | **AGGIUNGERE** | `frontend/src/components/` |
| `frontend/src/components/UpdatePrompt.jsx` | **AGGIUNGERE** | `frontend/src/components/` |
| `frontend/src/components/OfflineBanner.jsx` | **AGGIUNGERE** | `frontend/src/components/` |
| `frontend/src/pages/OfflinePage.jsx` | **AGGIUNGERE** | `frontend/src/pages/` |
| `frontend/src/hooks/useOnlineStatus.js` | **AGGIUNGERE** | `frontend/src/hooks/` |
| `backend/Controllers/HealthController.cs` | **AGGIUNGERE** | `backend/RecinzioniPortal.API/Controllers/` |
| `backend/appsettings.Development.json` | **AGGIUNGERE** | `backend/RecinzioniPortal.API/` |
| `backend/appsettings.Production.json` | **AGGIUNGERE** | `backend/RecinzioniPortal.API/` |
| `backend/web.config` | **AGGIUNGERE** | `backend/RecinzioniPortal.API/publish/` (dopo build) |
| `scripts/deploy.ps1` | **AGGIUNGERE** | `scripts/` (root progetto) |
| `scripts/deploy.sh` | **AGGIUNGERE** | `scripts/` (root progetto) |

### 3. Merge traduzioni i18n

Apri `frontend/i18n-merge/pwa-keys.json` e copia la sezione `"pwa"` dentro ciascun file lingua:

- `frontend/src/i18n/locales/it.json` ← aggiungi la sezione `"pwa"` dall'oggetto `"it"`
- `frontend/src/i18n/locales/en.json` ← aggiungi la sezione `"pwa"` dall'oggetto `"en"`
- `frontend/src/i18n/locales/fr.json` ← aggiungi la sezione `"pwa"` dall'oggetto `"fr"`
- `frontend/src/i18n/locales/de.json` ← aggiungi la sezione `"pwa"` dall'oggetto `"de"`

### 4. Integrare i componenti PWA nel Layout

Nel file `Layout.jsx` esistente, aggiungere i 3 componenti PWA:

```jsx
// In cima al file, aggiungi gli import:
import InstallPrompt from './InstallPrompt';
import UpdatePrompt from './UpdatePrompt';
import OfflineBanner from './OfflineBanner';

// Nel JSX del Layout, subito dentro il wrapper principale:
return (
  <div className="min-h-screen ...">
    <UpdatePrompt />        {/* Banner aggiornamento — top fisso */}
    {/* ...sidebar e header esistenti... */}
    <OfflineBanner />        {/* Banner offline — sotto l'header */}
    {/* ...contenuto pagina (Outlet)... */}
    <InstallPrompt />        {/* Banner installazione — bottom fisso */}
  </div>
);
```

### 5. Aggiungere la rotta OfflinePage (opzionale)

In `App.jsx`, aggiungere una rotta per la pagina offline:

```jsx
import OfflinePage from './pages/OfflinePage';

// Dentro le Routes:
<Route path="/offline" element={<OfflinePage />} />
```

### 6. Aggiungere la classe CSS per l'animazione (opzionale)

In `index.css`, aggiungi:

```css
/* Animazione lenta per icona aggiornamento */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
```

---

## Guida Deploy Produzione su IIS

### Prerequisiti server

| Componente | Versione | Note |
|---|---|---|
| Windows Server | 2019 o 2022 | |
| IIS | 10+ | Con moduli: URL Rewrite, Dynamic Compression |
| ASP.NET Core Hosting Bundle | 8.x | Scaricabile da https://dotnet.microsoft.com/download |
| .NET 8 Runtime | 8.x | Incluso nell'Hosting Bundle |
| SQL Server | 2019+ | Express, Standard o Enterprise |
| Node.js | 18+ LTS | Solo per la fase di build (non serve sul server in produzione) |
| Certificato SSL | Valido | I Service Worker richiedono HTTPS |

**Installazione Hosting Bundle:** Scaricarlo e installarlo PRIMA di configurare IIS. Riavviare IIS dopo l'installazione (`iisreset`).

### Setup Database

Eseguire gli script SQL in ordine nella query window di SQL Server Management Studio:

1. `database/01_create_database.sql` — Crea il database, tutte le tabelle e i dati seed
2. `database/02_auth_tables.sql` — Tabelle autenticazione (RefreshTokens, LoginAttempts)
3. `database/03_seed_listini_test.sql` — Dati di test aggiuntivi per listini

**Utenti seed creati:**

| Login | Password | Tipo | Ruolo |
|---|---|---|---|
| admin | admin123 | 1 | Amministratore |
| superuser | super123 | 2 | Super User (gestione listini) |
| caponegozio | capo123 | 3 | Capo Negozio (vede ordini PdV) |
| operatore | oper123 | 4 | Operatore (ordini propri) |

**IMPORTANTE:** Cambiare tutte le password al primo accesso.

### Configurazione appsettings.Production.json

Copiare `appsettings.Production.json` nella cartella del backend e compilare **tutti** i campi `CHANGE_ME`:

| Campo | Descrizione | Esempio |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | Stringa connessione SQL Server | `Server=SQLSRV01;Database=RecinzioniPortal;User Id=app_user;Password=P@ssw0rd!;TrustServerCertificate=true` |
| `Jwt:Key` | Chiave segreta JWT (min 32 caratteri) | `K3y$3cr3t@P0rt4l3R3c1nz10n1_2026!` |
| `Jwt:Issuer` | URL del portale | `https://portale.tuodominio.it` |
| `Jwt:Audience` | URL del portale (uguale a Issuer) | `https://portale.tuodominio.it` |
| `Smtp:Host` | Server SMTP | `smtp.tuodominio.it` |
| `Smtp:Port` | Porta SMTP | `587` (TLS) o `465` (SSL) |
| `Smtp:Username` | Utente SMTP | `noreply@tuodominio.it` |
| `Smtp:Password` | Password SMTP | La password dell'account email |
| `Smtp:From` | Indirizzo mittente | `noreply@tuodominio.it` |
| `Smtp:FromName` | Nome visualizzato | `Portale Recinzioni` |
| `Euritmo:IdEdiMittente` | Identificativo EDI mittente | EAN o P.IVA dell'azienda |
| `Euritmo:IdEdiDestinatario` | Identificativo EDI destinatario | EAN o P.IVA del fornitore |
| `Euritmo:FornitoreRagSoc` | Ragione sociale fornitore | Nome azienda |
| `Euritmo:FornitoreEmail` | Email invio ordini EDI | Email del fornitore |
| `Frontend:Url` | URL pubblico del portale | `https://portale.tuodominio.it` |

### Build completo

```bash
# 1. Build backend
cd backend/RecinzioniPortal.API
dotnet publish -c Release -o ./publish

# 2. Build frontend (genera anche Service Worker e manifest)
cd ../../frontend
npm install
npm run build

# 3. Copiare frontend compilato nel backend
# Windows:
xcopy /E /Y dist\* ..\backend\RecinzioniPortal.API\publish\wwwroot\
# Linux/Mac:
cp -r dist/* ../backend/RecinzioniPortal.API/publish/wwwroot/

# 4. Copiare web.config nella cartella publish
copy web.config ..\backend\RecinzioniPortal.API\publish\
```

Oppure usare lo script automatico:
```powershell
.\scripts\deploy.ps1
```

### Setup IIS

1. **Creare Application Pool:**
   - Nome: `RecinzioniPortal`
   - .NET CLR Version: **No Managed Code**
   - Managed Pipeline Mode: **Integrated**
   - Start Mode: **AlwaysRunning** (consigliato)

2. **Creare sito web:**
   - Nome: `Portale Recinzioni`
   - Application Pool: `RecinzioniPortal`
   - Physical Path: `C:\inetpub\wwwroot\recinzioni-portal` (o la cartella publish)
   - Binding: HTTPS, porta 443, hostname: `portale.tuodominio.it`
   - Certificato SSL: selezionare il certificato installato

3. **Binding aggiuntivo (redirect HTTP→HTTPS):**
   - HTTP, porta 80, stesso hostname
   - Aggiungere una URL Rewrite Rule per redirect permanente a HTTPS

4. **Permessi cartella:**
   - L'utente dell'App Pool (`IIS AppPool\RecinzioniPortal`) deve avere permessi di lettura sulla cartella del sito
   - Permessi di scrittura sulla sottocartella `wwwroot/euritmo` (per archivio file EDI)
   - Permessi di scrittura sulla cartella `logs` (se si abilita stdoutLogEnabled)

### Deploy con script PowerShell

```powershell
# Deploy completo (backup + build + deploy + health check)
.\scripts\deploy.ps1

# Deploy con percorsi custom
.\scripts\deploy.ps1 -IISSitePath "D:\sites\recinzioni" -AppPoolName "RecinzioniPool"

# Solo frontend (il backend non cambia)
.\scripts\deploy.ps1 -SkipBackend

# Solo backend (il frontend non cambia)
.\scripts\deploy.ps1 -SkipFrontend

# Deploy senza backup (es. primo deploy)
.\scripts\deploy.ps1 -SkipBackup
```

### Verifica post-deploy

1. **Health check:**
   ```
   GET https://portale.tuodominio.it/api/health
   ```
   Risposta attesa:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "environment": "Production",
     "version": "1.0.0"
   }
   ```

2. **Test login:** Aprire il portale nel browser, effettuare login con le credenziali seed.

3. **Test PWA installabilità:**
   - Chrome/Edge: dovrebbe comparire l'icona "Installa app" nella barra indirizzi
   - Il banner `InstallPrompt` dovrebbe apparire in basso alla pagina
   - DevTools → Application → Manifest → verificare che tutti i campi siano corretti
   - DevTools → Application → Service Workers → verificare che il SW sia registrato e attivo

4. **Test offline:**
   - DevTools → Network → spuntare "Offline"
   - La shell dell'app si deve comunque mostrare (è in cache)
   - Il banner rosso "Sei offline" deve apparire sotto l'header
   - Navigare su una pagina non cachata → deve apparire la pagina offline

### Aggiornamento (deploy nuova versione)

```powershell
# Lo script fa tutto: backup, build, stop IIS, deploy, start IIS, health check
.\scripts\deploy.ps1
```

Dettaglio manuale:
1. Fare backup della versione attuale
2. Eseguire build (backend e/o frontend)
3. Fermare l'App Pool IIS: `Stop-WebAppPool -Name RecinzioniPortal`
4. Copiare i nuovi file nella cartella del sito
5. Avviare l'App Pool IIS: `Start-WebAppPool -Name RecinzioniPortal`
6. Verificare health check
7. Il Service Worker si aggiornerà automaticamente; gli utenti vedranno il banner "Aggiornamento disponibile"

### Troubleshooting

| Problema | Causa probabile | Soluzione |
|---|---|---|
| Errore 502.5 all'avvio | Hosting Bundle non installato o versione .NET errata | Installare ASP.NET Core 8 Hosting Bundle, riavviare IIS |
| Errore "Unable to connect to SQL Server" | Connection string errata o SQL Server non raggiungibile | Verificare `appsettings.Production.json`, testare connessione con SSMS |
| JWT "401 Unauthorized" su tutte le richieste | Jwt:Key troppo corta o diversa tra istanze | Verificare che Key sia >= 32 caratteri in Production.json |
| CORS error nel browser | Frontend:Url non corretto | Impostare l'URL esatto del portale in `Frontend:Url` |
| PWA non installabile | Manca HTTPS o manifest non caricato | Verificare certificato SSL; DevTools → Application → Manifest |
| Service Worker non registrato | Errore JS nel build o HTTPS mancante | Controllare console browser; i SW funzionano solo su HTTPS o localhost |
| Pagina bianca dopo deploy | Build frontend non copiato in wwwroot | Verificare che `publish/wwwroot/index.html` esista |
| Stili rotti / CSS mancante | Vecchi file in cache | Svuotare cache browser o fare hard refresh (Ctrl+Shift+R) |

**Log location:**
- ASP.NET Core stdout: `{sito}\logs\stdout_*.log` (se `stdoutLogEnabled=true` in web.config)
- Event Viewer: Windows Logs → Application → filtrare per "IIS AspNetCore Module"
- Browser: DevTools → Console (errori JS) e Application (SW e manifest)

---

## Checklist Pre Go-Live

- [ ] `appsettings.Production.json` compilato con valori reali (nessun CHANGE_ME rimasto)
- [ ] JWT Key cambiata (minimo 32 caratteri, diversa da quella di sviluppo)
- [ ] SMTP configurato e testato (inviare email di test con forgot-password)
- [ ] Certificato SSL installato su IIS (HTTPS obbligatorio per PWA)
- [ ] Icone/logo sostituiti con quelli del cliente (sostituire i file in `public/`)
- [ ] Identificativi EDI EURITMO configurati in appsettings (se disponibili)
- [ ] Database creato con tutti gli script SQL (01, 02, 03)
- [ ] Password utenti seed cambiate al primo accesso
- [ ] Health check OK: `GET /api/health` → `status: healthy`
- [ ] PWA installabile da Chrome/Edge (icona nella barra indirizzi)
- [ ] Service Worker registrato: DevTools → Application → Service Workers
- [ ] Manifest.json caricato: DevTools → Application → Manifest
- [ ] Test offline: staccare rete → shell app visibile + banner rosso "Sei offline"
- [ ] Test completo: login → catalogo → configuratore → carrello → preventivo → ordine
- [ ] Permessi cartella `wwwroot/euritmo` impostati per scrittura

---

## Analisi bundle (opzionale)

Per visualizzare la composizione del bundle e identificare dipendenze pesanti:

```bash
cd frontend
npm install -D rollup-plugin-visualizer
```

Aggiungere temporaneamente in `vite.config.js`:
```js
import { visualizer } from 'rollup-plugin-visualizer';

// Dentro plugins: [...]
visualizer({ open: true, gzipSize: true, brotliSize: true })
```

Eseguire `npm run build` → si aprirà automaticamente un report HTML con il treemap del bundle.

**Dimensioni attese dei chunk:**
- `vendor-react` ~140KB gzipped
- `vendor-three` ~400KB gzipped (Three.js è il chunk più grande)
- `vendor-ui` ~30KB gzipped
- `vendor-i18n` ~15KB gzipped
- App code ~50-80KB gzipped

---

## Note

- Le icone in `public/` sono placeholder con le iniziali "RP" su sfondo blu (#2563eb). Sostituirle con il logo del cliente prima del go-live.
- I Service Worker funzionano solo su **HTTPS** o **localhost**. Il certificato SSL è obbligatorio per la PWA.
- Il `drop_console: true` nel build production rimuove tutti i `console.log`. Per debug in produzione, abilitare `stdoutLogEnabled=true` nel web.config.
- Il selettore lingua nel Layout.jsx (vicino al logout) continua a funzionare normalmente; le chiavi `pwa.*` vengono tradotte automaticamente in base alla lingua selezionata.
