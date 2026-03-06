# CLAUDE.md — Recinzioni Portal

## Project Overview

**Recinzioni Portal** is a full-stack B2B web application for an Italian fencing products company (Trafilplast). It allows dealers/resellers to browse a product catalog, configure custom fence assemblies with a 3D visualizer, manage quotes/orders, and submit orders electronically to the supplier via GS1 EURITMO EDI standard.

The application supports 4 languages (IT, EN, FR, DE), WCAG 2.1 AA accessibility (Legge Stanca compliant), and is deployed as a Progressive Web App (PWA) on Windows Server / IIS.

## Repository Structure

```
TrafilplastNew/
├── CLAUDE.md                          # This file
├── README.md
├── DOCUMENTAZIONE_TECNICA.md          # Comprehensive technical docs (Italian)
├── ANALISI_FUNZIONALE.docx            # Functional analysis with diagrams
├── generate_docx.py                   # DOCX generation script (matplotlib)
├── generate_docx_final.py             # Final DOCX generator version
├── .gitignore
├── diagrams/                          # Architecture & flow diagrams (PNG)
│   ├── 01_flusso_generale.png
│   ├── 02_flusso_autenticazione.png
│   ├── 03_flusso_catalogo.png
│   ├── 04_flusso_configuratore.png
│   ├── 05_flusso_ordini.png
│   ├── 06_flusso_admin.png
│   ├── 07_flusso_listini.png
│   └── 08_architettura.png
└── recinzioni-portal/
    ├── backend/                       # ASP.NET Core 8 Web API
    │   └── RecinzioniPortal.API/
    │       ├── Controllers/           # 8 API controllers
    │       ├── Models/                # Entity models (Entities.cs, AuthEntities.cs)
    │       ├── DTOs/                  # Data Transfer Objects (Dtos.cs)
    │       ├── Services/              # Business logic (5 services)
    │       ├── Data/                  # EF Core DbContext (AppDbContext)
    │       ├── wwwroot/               # Static files, logos, EDI archives
    │       ├── Program.cs             # App startup and middleware pipeline
    │       ├── appsettings.json       # Base config
    │       ├── appsettings.Development.json
    │       ├── appsettings.Production.json
    │       └── web.config             # IIS configuration
    ├── frontend/                      # React 18 SPA (Vite)
    │   ├── src/
    │   │   ├── main.jsx               # Entry point, PWA registration
    │   │   ├── App.jsx                # Route definitions, auth check
    │   │   ├── components/            # Reusable UI components (12 files)
    │   │   │   └── configurator/      # 3D/2D fence visualization
    │   │   ├── pages/                 # Route-level page components (10 pages)
    │   │   │   └── admin/             # Admin-only pages (2 pages)
    │   │   ├── services/api.js        # HTTP client with JWT handling
    │   │   ├── store/store.js         # Zustand stores (auth, cart)
    │   │   ├── utils/formatters.js    # Locale-aware formatting
    │   │   ├── i18n/                  # i18next config + locale files
    │   │   └── index.css              # Tailwind + global styles
    │   ├── vite.config.js             # Build config, PWA, proxy, chunking
    │   ├── tailwind.config.js
    │   └── package.json
    ├── database/                      # SQL Server schema scripts
    │   ├── 01_create_database.sql     # Core tables + seed data
    │   ├── 02_auth_tables.sql         # Auth security tables
    │   └── 07_euritmo_config.sql      # Optional EDI config table
    ├── scripts/                       # Build, deploy & migrations
    │   ├── deploy.sh                  # Linux/Mac local build
    │   ├── deploy.ps1                 # Windows/IIS production deploy
    │   ├── migration_add_prodotti_config.sql
    │   ├── migration_add_clienti_address.sql
    │   ├── migration_align_configurator_products.sql
    │   └── migration_set_conf_rec_cfgtipo.sql
    ├── tools/
    │   └── check-i18n.js             # i18n completeness checker
    ├── docs/                          # Reference documents
    │   ├── CONF-REC_sctec.pdf         # Fence configurator technical spec
    │   ├── CONF-REC_tools.pdf         # Configurator tools reference
    │   ├── PREZZI RECINZIONI.pdf      # Fence pricing reference
    │   └── PREZZI RECINZIONI.xlsx     # Fence pricing spreadsheet
    ├── da_integrare/                  # Phase 6: EURITMO EDI + email
    ├── da_integrare_7/                # Phase 7: Full i18n + WCAG a11y
    └── da_integrare_8/                # Phase 8: PWA + production deploy
```

## Technology Stack

### Backend
- **Runtime:** .NET 8.0, ASP.NET Core Web API, C# 12
- **ORM:** Entity Framework Core 8.0.11 (SQL Server provider)
- **Database:** Microsoft SQL Server (Latin1_General_CI_AS collation)
- **Auth:** JWT Bearer (HS256 symmetric), BCrypt password hashing (BCrypt.Net-Next 4.0.3, cost 12)
- **PDF:** QuestPDF 2026.2.1 (Community license)
- **Excel:** ClosedXML 0.104.2 for import/export
- **EDI:** Custom EURITMO ORDERS Release 25.1 generator
- **API Docs:** Swagger/OpenAPI via Swashbuckle 6.9.0

### Frontend
- **Framework:** React 18.3.1 with Vite 6.0.0
- **Routing:** React Router DOM 6.28.0 (nested layouts)
- **State:** Zustand 5.0.0 (auth store + cart store)
- **3D:** Three.js 0.170.0 + React Three Fiber + @react-three/drei
- **Styling:** Tailwind CSS 3.4.15 with custom color theme (primary red, success green)
- **i18n:** i18next 24.0.0 (IT, EN, FR, DE)
- **Icons:** Lucide React 0.460.0
- **PWA:** vite-plugin-pwa 0.21.0 with Workbox runtime caching
- **Notifications:** react-hot-toast 2.4.1

## Development Setup

### Prerequisites
- .NET 8 SDK
- Node.js (LTS) + npm
- SQL Server (local or remote)

### Backend
```bash
cd recinzioni-portal/backend/RecinzioniPortal.API
dotnet restore
dotnet run                 # Starts on http://localhost:5000
```

### Frontend
```bash
cd recinzioni-portal/frontend
npm install
npm run dev                # Starts on http://localhost:5173, proxies /api to :5000
```

### Database
Execute SQL scripts in order against a SQL Server instance:
1. `database/01_create_database.sql` — Core schema + seed data
2. `database/02_auth_tables.sql` — Auth security tables
3. `scripts/migration_add_prodotti_config.sql` — Add config columns to Prodotti
4. `scripts/migration_add_clienti_address.sql` — Add address columns to Clienti
5. `scripts/migration_align_configurator_products.sql` — Align DiBaCod/CfgColore for fence products + add color variants
6. `scripts/migration_set_conf_rec_cfgtipo.sql` — Set CfgTipo='recinzione' on CONF-REC product
7. (Optional) `database/07_euritmo_config.sql` — EDI config via DB

### Build for Deployment
```bash
# Linux/Mac
cd recinzioni-portal && bash scripts/deploy.sh

# Windows/IIS
cd recinzioni-portal && .\scripts\deploy.ps1
```

## Common Commands

| Task | Command | Working Directory |
|------|---------|-------------------|
| Run backend | `dotnet run` | `recinzioni-portal/backend/RecinzioniPortal.API` |
| Run frontend dev server | `npm run dev` | `recinzioni-portal/frontend` |
| Build frontend | `npm run build` | `recinzioni-portal/frontend` |
| Preview frontend build | `npm run preview` | `recinzioni-portal/frontend` |
| Check i18n completeness | `node tools/check-i18n.js` | `recinzioni-portal` |
| Check i18n verbose | `node tools/check-i18n.js --verbose` | `recinzioni-portal` |
| Publish backend | `dotnet publish -c Release` | `recinzioni-portal/backend/RecinzioniPortal.API` |

## Architecture & Key Patterns

### API Structure
All API endpoints are under `/api/` with controller-based routing:

| Controller | Route | Auth | Purpose |
|------------|-------|------|---------|
| `HealthController` | `/api/health` | Anonymous | Health check (DB connectivity) |
| `AuthController` | `/api/auth` | Mixed | Login, refresh, password change, password reset |
| `ProdottiController` | `/api/prodotti` | Authenticated | Product catalog + filters |
| `ConfiguratoreController` | `/api/configuratore` | Authenticated | Fence BOM calculation |
| `OrdiniController` | `/api/ordini` | Authenticated | Orders/quotes CRUD + EDI |
| `ListiniController` | `/api/listini` | Super User | Price list management |
| `UtentiController` | `/api/utenti` | Admin | User CRUD + Excel import/export |
| `ImportController` | `/api/import` | Admin | Bulk data import/export |

### Backend Services
| Service | Purpose |
|---------|---------|
| `AuthService` | JWT token generation, password hashing/verification, password reset flow |
| `ConfiguratoreService` | Fence BOM calculation, component lookup by DiBaCod/CfgColore |
| `EuritmoService` | EURITMO EDI file generation (fixed-length records) |
| `EmailService` | SMTP email sending for EDI orders and password resets |
| `PdfService` | PDF generation for quotes/orders via QuestPDF |

### User Types & Permissions
| Type | Code | Access |
|------|------|--------|
| Admin | 1 | Full system: users, imports, all data |
| Super User | 2 | Price list management for assigned customer |
| Manager (Capo Negozio) | 3 | Orders for assigned sale point |
| Operator (Operatore) | 4 | Orders for own user only |

### Frontend Routing
- `/login`, `/forgot-password`, `/reset-password` — Public auth routes
- `/admin/utenti`, `/admin/import` — Admin-only (type 1)
- `/listini` — Super User only (type 2)
- `/catalogo`, `/configuratore`, `/carrello`, `/preventivo`, `/ordini` — Shop users (type 3-4)
- `/offline` — PWA offline fallback
- `/` redirects based on user type

### Frontend Components

**Layout & Navigation:**
- `Layout.jsx` — Main app shell with sidebar, header, language switcher
- `SkipLinks.jsx` — WCAG skip navigation links
- `OfflineBanner.jsx` — Network status indicator

**PWA:**
- `InstallPrompt.jsx` — PWA install prompt
- `UpdatePrompt.jsx` — Service worker update notification

**Modals & Shared UI:**
- `ProductDetailModal.jsx` — Product detail with images, pricing, add-to-cart
- `ChangePasswordModal.jsx` — In-app password change with strength indicator
- `PasswordStrengthIndicator.jsx` — Visual password strength feedback
- `EuritmoPreviewModal.jsx` — Preview EURITMO EDI content before sending

**Accessibility:**
- `Accessible3DCanvas.jsx` — Accessible wrapper for Three.js canvas
- `AccessibleConfigurator.jsx` — Text-based alternative to 3D configurator

**3D Configurator (`components/configurator/`):**
- `FenceScene3D.jsx` — Three.js 3D fence scene
- `PlanView2D.jsx` — 2D plan/top-down view

**Custom Hooks (in `components/configurator/`):**
- `useFocusTrap.js` — Focus trapping for modal accessibility
- `useOnlineStatus.js` — Network connectivity detection

### Pages
| Page | File | Purpose |
|------|------|---------|
| Login | `LoginPage.jsx` | Auth with remember-me |
| Forgot Password | `ForgotPasswordPage.jsx` | Email-based password reset request |
| Reset Password | `ResetPasswordPage.jsx` | Token-based password reset |
| Catalog | `CatalogPage.jsx` | Product browsing with filters |
| Configurator | `ConfiguratorPage.jsx` | 3D fence assembly builder |
| Cart | `CartPage.jsx` | Shopping cart with IVA calculation |
| Quote Form | `QuoteFormPage.jsx` | Billing/delivery data for quote |
| Orders | `OrdersPage.jsx` | Order history, status tracking, EDI sending |
| Price Lists | `PriceListsPage.jsx` | Super User price management |
| Offline | `OfflinePage.jsx` | PWA offline fallback |
| **Admin:** Users | `admin/UsersPage.jsx` | User CRUD + Excel import/export |
| **Admin:** Import | `admin/ImportPage.jsx` | Bulk data import/export |

### State Management
- **Auth store** (`useAuthStore`): user session, login/logout, token refresh
- **Cart store** (`useCartStore`): session-only cart with items, quantities, totals (22% IVA)
- Tokens stored in `sessionStorage` (session) or `localStorage` (remember-me)

### API Client Pattern
`services/api.js` provides a singleton HTTP client:
- Auto-attaches `Bearer` JWT token
- Auto-refreshes on 401 responses
- Methods: `get()`, `post()`, `put()`, `del()`, `upload()`, `downloadBlob()`
- Dev proxy: Vite proxies `/api` to `http://localhost:5000`

### PWA Caching Strategy
Configured in `vite.config.js` via Workbox runtime caching:
- **Products API** (`/api/prodotti`): StaleWhileRevalidate (cache-first, background refresh)
- **Critical APIs** (`/api/ordini`, `/api/auth`): NetworkFirst (fresh data preferred)
- **Price lists** (`/api/listini`): StaleWhileRevalidate
- **Health checks** (`/api/health`): NetworkFirst
- **Images & fonts**: CacheFirst with expiration
- **Manual chunks**: vendor code split into react, three, ui, i18n bundles

### Database Schema Conventions
- **Italian naming**: table and column names use Italian (e.g., `Clienti`, `PuntiDiVendita`, `OrdPrevTst`)
- **Composite keys**: Used extensively (e.g., `PrdCod + LstCod` for prices, `OrdNum + RigaNum` for order lines)
- **Decimal precision**: Prices use `decimal(19,6)`, monetary amounts use `decimal(19,2)`, VAT rate uses `decimal(5,2)`
- **Soft conventions**: `ItemID` = customer code, `ItemIDSede` = sale point code, `PrdCod` = product code, `LstCod` = price list code
- **Order numbering**: `OrdNum` is auto-increment identity
- **Configurator columns**: `DiBaCod` = component base code, `CfgColore` = color variant code, `CfgTipo` = configuration type (e.g., 'recinzione')

### Key Business Entities
- **Clienti** → Customers (dealers/resellers)
- **PuntiDiVendita** → Sale points/branches per customer
- **Prodotti** → Product catalog with multilingual translations + configurator fields (DiBaCod, CfgColore, CfgTipo)
- **Prezzi** → Price lists (personalized per customer or public)
- **OrdPrevTst/Dett/Config** → Order/quote header, line items, fence configuration
- **LstTst** → Price list validity periods

## Code Conventions

### Backend (C#)
- Single `.cs` files for models: `Entities.cs` (all business entities), `AuthEntities.cs` (auth entities), `Dtos.cs` (all DTOs)
- Service classes contain business logic; controllers are thin wrappers
- Italian comments and variable names in domain-specific code
- `[Authorize]` attribute on controllers; `[AllowAnonymous]` for public endpoints
- User type checked via JWT claims (`ClaimTypes.NameIdentifier`, custom `UserType` claim)
- EF Core with `DbSet<T>` for each entity in `AppDbContext`
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)

### Frontend (React/JSX)
- Functional components with hooks (no class components)
- File naming: PascalCase for components (`CatalogPage.jsx`), camelCase for utilities (`formatters.js`)
- Pages in `src/pages/`, reusable components in `src/components/`
- Tailwind CSS utility classes for styling; custom classes defined in `index.css` (`.card`, `.btn-primary`, `.btn-success`, `.btn-secondary`, `.btn-danger`, `.input-field`)
- `useTranslation()` hook for all user-facing strings — never hardcode text
- `useFormatters()` hook for locale-aware number/currency/date formatting
- Toast notifications via `react-hot-toast` for user feedback
- Forms use controlled components with `useState`

### Internationalization
- **Reference language:** Italian (`it.json`)
- **Supported:** IT, EN, FR, DE
- All user-facing strings must go through `t('key')` from `react-i18next`
- Currency/date formatting via `utils/formatters.js` (uses `Intl` API)
- Run `node tools/check-i18n.js` to verify translation completeness
- Translation files: `frontend/src/i18n/locales/{it,en,fr,de}.json`

### Accessibility (WCAG 2.1 AA / Legge Stanca)
- Skip links via `<SkipLinks />` component
- Focus trap in modals via `useFocusTrap` hook
- `aria-label`, `aria-hidden`, `aria-expanded`, `aria-invalid` on interactive elements
- Decorative icons get `aria-hidden="true"`
- Tables use `scope="col"` on headers
- Color contrast: use `primary-700` or darker for text (minimum 4.5:1 ratio)
- 3D canvas has text-based alternative (`Accessible3DCanvas` / `AccessibleConfigurator`)
- Password strength indicator provides accessible feedback

## Key Business Logic

### Fence Configurator
The configurator (`ConfiguratoreService`) calculates a Bill of Materials (BOM) for custom fence assemblies:
- **Inputs:** post height (100/150/185/200 cm), slat type (persiana/pieno), colors (hex), mounting type (cemento/terreno), sections (length 10-150cm + angle)
- **Output:** Component list with quantities and prices from user's price list
- Components: posts (pali), slats (doghe), fasteners (fissaggi), spacers, caps, angular joints, covers (COV-*)
- Products looked up by `DiBaCod` + `CfgColore` mapping
- Color variants: BI (bianco/white), MA (marrone/brown), AN (antracite/anthracite)
- REST endpoint: `POST /api/configuratore/calcola`

### Price Resolution
Prices resolve through a cascade:
1. Personalized sale-point list (if valid dates)
2. Sale-point default list code
3. Public list (`LstCodPubb`)
4. Customer default list

### Order Flow
1. **Cart** (Carrello) → items added from catalog or configurator
2. **Quote** (Preventivo) → cart submitted with billing/delivery data
3. **Order** (Ordine) → quote confirmed
4. **Sent** → order transmitted via EURITMO EDI file + email to supplier
- IVA (VAT) is fixed at 22%

### EURITMO EDI
- Format: GS1 Italy EURITMO ORDERS Release 25.1
- Fixed-length record file (.edi) with record types: BGM, NAS, CTA, NAB, NAD, NAI, DTM, FTX, PAT, LIN, CNT
- Generated by `EuritmoService`, emailed by `EmailService`, archived in `wwwroot/euritmo/`
- Previewable via `EuritmoPreviewModal` before sending

## Integration Phases (da_integrare)

The `da_integrare*` directories contain code for incremental feature phases not yet fully merged:

| Directory | Phase | Content |
|-----------|-------|---------|
| `da_integrare/` | Phase 6 | EURITMO EDI generation + email service |
| `da_integrare_7/` | Phase 7 | Complete i18n + WCAG 2.1 AA accessibility |
| `da_integrare_8/` | Phase 8 | PWA support + IIS production deployment |

Each contains a `README.md` with detailed integration instructions. Code from these phases has been largely integrated into the main `backend/` and `frontend/` directories already.

## Documentation

| File | Location | Description |
|------|----------|-------------|
| `DOCUMENTAZIONE_TECNICA.md` | Root | Comprehensive technical documentation (Italian) |
| `ANALISI_FUNZIONALE.docx` | Root | Functional analysis with architecture diagrams |
| `diagrams/` | Root | 8 PNG flow diagrams (auth, catalog, configurator, orders, admin, etc.) |
| `docs/` | `recinzioni-portal/` | Product specs: CONF-REC technical sheets, pricing PDFs/XLSX |
| `generate_docx_final.py` | Root | Python script to regenerate DOCX documentation with matplotlib diagrams |

## Environment Configuration

### Key Config Sections (appsettings.json)
- `ConnectionStrings:DefaultConnection` — SQL Server connection string
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` — JWT authentication
- `Smtp:Host/Port/Username/Password/From` — Email sending
- `Euritmo:*` — EDI file generation parameters (IDs, supplier address, archive path)
- `Frontend:Url` — Frontend origin for CORS and email links

### Development Defaults
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (Vite dev server)
- Database: `RecinzioniPortal_Dev` with Windows Auth
- SMTP: `localhost:1025` (MailHog for testing)
- Swagger UI available at `/swagger` in Development mode

### Production (IIS)
- HTTPS required (for PWA service worker)
- `web.config` handles URL rewrite for SPA, security headers, compression
- Deploy via `scripts/deploy.ps1` which handles build, IIS app pool stop/start, health check
- Health check: `GET /api/health` returns DB status and version
- Terser minification removes console/debugger statements in production builds
- Source maps disabled for production

## Important Notes for AI Assistants

1. **Language:** The codebase mixes Italian (domain terms, comments, DB columns) and English (code structure, framework conventions). Follow existing patterns — use Italian for domain-specific naming and English for technical code.

2. **No test framework** is currently set up. There are no unit tests or integration tests in the repository.

3. **Single-project backend:** All backend code lives in one ASP.NET Core project (`RecinzioniPortal.API`). There are no separate class libraries.

4. **Models in shared files:** Entities are grouped in `Entities.cs` and `AuthEntities.cs`, DTOs in `Dtos.cs` — add new models to the appropriate existing file rather than creating new ones.

5. **Frontend is plain JSX** (not TypeScript), despite `@types/react` being in devDependencies. Follow the JSX convention.

6. **Vite proxy:** In development, the frontend proxies `/api` requests to the backend. No need to hardcode backend URLs.

7. **PWA considerations:** Changes to static assets may require service worker cache invalidation. The `vite-plugin-pwa` handles this via content hashing. The app uses Workbox runtime caching with different strategies per API route.

8. **Database changes:** Write idempotent migration scripts (check `IF NOT EXISTS` before `ALTER TABLE`). Place them in `recinzioni-portal/scripts/`.

9. **i18n:** After adding any user-facing strings, add translations to all 4 locale files and verify with `node tools/check-i18n.js`.

10. **Decimal precision matters:** Always use `decimal(19,6)` for unit prices and `decimal(19,2)` for totals/amounts in SQL and C# models.

11. **Custom hooks location:** Hooks like `useFocusTrap` and `useOnlineStatus` live in `src/components/configurator/`, not in a separate `hooks/` directory.

12. **Configurator product mapping:** Products used by the fence configurator must have `DiBaCod`, `CfgColore`, and `CfgTipo` columns set correctly. See `migration_align_configurator_products.sql` for examples.

13. **Reference documents:** The `docs/` directory contains product specs and pricing references useful for understanding the fence configurator domain.
