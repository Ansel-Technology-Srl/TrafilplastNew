# Contesto Chat — Recinzioni Portal

> File generato il 2026-03-06 per consentire la continuità tra sessioni di sviluppo con Claude.

## Branch di lavoro

- **Branch:** `claude/claude-md-mm42pj5xwnjxx8aq-mJAnW`
- **Ultimo commit:** `9641135` — "Add dark/light mode toggle, fix blank page on first load, update Legge Stanca compliance"
- **Stato:** Working tree pulito, nessuna modifica pendente

## Cronologia commit della sessione

```
9641135 Add dark/light mode toggle, fix blank page on first load, update Legge Stanca compliance
8c5452c Fix PWA update flow and update documentation with detailed PWA section
d0bd5c6 Add DOCX generation scripts for functional analysis
a731c95 Add functional analysis DOCX with flow diagrams
1509517 Add comprehensive technical documentation for AI-reproducible development
```

## Lavori completati

### 1. Documentazione tecnica completa
- **DOCUMENTAZIONE_TECNICA.md** — Documentazione tecnica completa del progetto, strutturata per essere riproducibile da AI
- **ANALISI_FUNZIONALE.docx** — Documento Word di analisi funzionale (~45-50 pagine) generato da `generate_docx_final.py`
- **CLAUDE.md** — File di istruzioni per il progetto (già esistente, aggiornato)

### 2. PWA (Progressive Web App)
- Corretto il flusso di aggiornamento PWA (Service Worker con `skipWaiting`/`clientsClaim`)
- Configurazione `vite-plugin-pwa` con Workbox
- Banner di aggiornamento per notificare gli utenti quando è disponibile una nuova versione
- Documentazione PWA aggiunta a DOCUMENTAZIONE_TECNICA.md

### 3. Dark/Light Mode
- **Store Zustand** (`useThemeStore`) in `store/store.js` con `toggleTheme()`, `setTheme()`, `initTheme()`
- **Persistenza** in `localStorage`, rispetto di `prefers-color-scheme`
- **Strategia Tailwind:** `darkMode: 'class'` con prefisso `dark:` su tutte le classi
- **Toggle UI:** Pulsante Sun/Moon nella sidebar (Layout.jsx) e nella pagina login
- **i18n:** Traduzioni "theme.light/dark/toggle" in IT, EN, FR, DE
- **Pagine/componenti aggiornati con classi dark:**
  - LoginPage, ForgotPasswordPage, ResetPasswordPage
  - CatalogPage, ConfiguratorPage, CartPage, QuoteFormPage
  - OrdersPage, PriceListsPage, OfflinePage
  - admin/UsersPage, admin/ImportPage
  - Layout, ChangePasswordModal, ProductDetailModal, EuritmoPreviewModal
  - PasswordStrengthIndicator, Accessible3DCanvas, SkipLinks
- **CSS globale** (`index.css`): varianti dark per classi custom (`.card`, `.btn-primary`, ecc.)

### 4. Fix pagina bianca al primo caricamento
- **Problema:** Dopo il deploy, il browser cachava `index.html` con riferimenti a bundle JS vecchi → pagina bianca
- **Fix backend (Program.cs):**
  - Middleware `app.Use()` che aggiunge header `Cache-Control: no-cache, no-store, must-revalidate` per risposte HTML
  - `StaticFileOptions.OnPrepareResponse` per `index.html`, `sw.js`, `workbox-*.js`
- **Fix IIS (web.config):**
  - Regola `NoCacheHTML` per risposte `text/html`
  - Pattern espanso per includere `index.html`

### 5. Conformità Legge Stanca (WCAG 2.1 AA)
- Verificata conformità con criteri WCAG 2.1 AA (Legge 4/2004)
- Contrasto colori >= 4.5:1
- Navigazione da tastiera, focus visibile, skip links
- Supporto screen reader (aria-label, aria-hidden, scope="col")
- Rispetto di `prefers-reduced-motion` e `forced-colors`
- Documentazione aggiunta in Sezione 8 di DOCUMENTAZIONE_TECNICA.md

## File principali modificati

| File | Tipo di modifica |
|------|-----------------|
| `frontend/src/store/store.js` | Aggiunto `useThemeStore` |
| `frontend/src/App.jsx` | Aggiunto `initTheme()` su mount |
| `frontend/src/components/Layout.jsx` | Toggle dark mode in sidebar |
| `frontend/src/pages/LoginPage.jsx` | Toggle + classi dark |
| `frontend/tailwind.config.js` | `darkMode: 'class'` |
| `frontend/src/index.css` | Varianti dark per classi custom |
| `frontend/src/i18n/locales/*.json` | Traduzioni tema (4 lingue) |
| `frontend/src/pages/*.jsx` | Classi `dark:` su tutte le pagine |
| `frontend/src/components/*.jsx` | Classi `dark:` su tutti i componenti |
| `backend/.../Program.cs` | Middleware no-cache per HTML |
| `backend/.../web.config` | Regole IIS no-cache |
| `DOCUMENTAZIONE_TECNICA.md` | Sezione 8 Legge Stanca + Dark Mode |
| `ANALISI_FUNZIONALE.docx` | Sezione 12.2 aggiornata |

## Istruzioni per il deploy in produzione (IIS)

### Procedura

1. **Build frontend:**
   ```bash
   cd recinzioni-portal/frontend
   npm run build
   ```

2. **Publish backend:**
   ```bash
   cd recinzioni-portal/backend/RecinzioniPortal.API
   dotnet publish -c Release -o ./publish
   ```

3. **Copia frontend nel backend:**
   ```bash
   cp -r ../../frontend/dist/* ./publish/wwwroot/
   ```

4. **Deploy su IIS:**
   - Ferma Application Pool
   - Copia contenuto di `publish/` nella directory dell'app IIS
   - Riavvia Application Pool

5. **Oppure script automatizzato:**
   ```powershell
   cd recinzioni-portal
   .\scripts\deploy.ps1
   ```

6. **Verifica:** `GET /api/health` deve restituire stato DB

### Post-deploy
- Il fix del caching previene la pagina bianca
- Se utenti hanno vecchia cache: Ctrl+Shift+R o disregistrare il Service Worker

## Note per la prossima sessione

- **Nessun task pendente** — tutti i lavori richiesti sono stati completati
- Il branch è pushato e aggiornato
- Non ci sono test automatizzati nel progetto (nessun framework di test configurato)
- Per riferimento completo all'architettura, leggere `CLAUDE.md` nella root del progetto
- La documentazione DOCX si rigenera con: `python generate_docx_final.py`

## Configurazione ambiente

- **Backend:** .NET 8, ASP.NET Core, EF Core, SQL Server — porta 5000
- **Frontend:** React 18, Vite 6, Tailwind CSS, Three.js — porta 5173
- **Database:** SQL Server con collation `Latin1_General_CI_AS`
- **Server produzione:** IIS su `192.168.253.75:8090`
