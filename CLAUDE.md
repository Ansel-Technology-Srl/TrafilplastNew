# CLAUDE.md — Recinzioni Portal

## Project Overview

**Recinzioni Portal** is a full-stack B2B web application for an Italian fencing products company (Trafilplast). It allows dealers/resellers to browse a product catalog, configure custom fence assemblies with a 3D visualizer, manage quotes/orders, and submit orders electronically to the supplier via GS1 EURITMO EDI standard.

The application supports 4 languages (IT, EN, FR, DE), WCAG 2.1 AA accessibility, and is deployed as a Progressive Web App (PWA) on Windows Server / IIS.

## Repository Structure

```
TrafilplastNew/
├── CLAUDE.md                          # This file
├── README.md
├── .gitignore
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
    │   │   ├── components/            # Reusable UI components
    │   │   │   └── configurator/      # 3D/2D fence visualization
    │   │   ├── pages/                 # Route-level page components
    │   │   │   └── admin/             # Admin-only pages
    │   │   ├── services/api.js        # HTTP client with JWT handling
    │   │   ├── store/store.js         # Zustand stores (auth, cart)
    │   │   ├── hooks/                 # Custom React hooks
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
    ├── scripts/                       # Build & deploy automation
    │   ├── deploy.sh                  # Linux/Mac local build
    │   ├── deploy.ps1                 # Windows/IIS production deploy
    │   ├── migration_add_prodotti_config.sql
    │   └── migration_add_clienti_address.sql
    ├── tools/
    │   └── check-i18n.js             # i18n completeness checker
    ├── da_integrare/                  # Phase 6: EURITMO EDI + email
    ├── da_integrare_7/                # Phase 7: Full i18n + WCAG a11y
    └── da_integrare_8/                # Phase 8: PWA + production deploy
```

## Technology Stack

### Backend
- **Runtime:** .NET 8.0, ASP.NET Core Web API, C# 12
- **ORM:** Entity Framework Core 8.0.11 (SQL Server provider)
- **Database:** Microsoft SQL Server (Latin1_General_CI_AS collation)
- **Auth:** JWT Bearer (HS256 symmetric), BCrypt password hashing (cost 12)
- **PDF:** QuestPDF 2026.2.1 (Community license)
- **Excel:** ClosedXML 0.104.2 for import/export
- **EDI:** Custom EURITMO ORDERS Release 25.1 generator
- **API Docs:** Swagger/OpenAPI via Swashbuckle

### Frontend
- **Framework:** React 18.3.1 with Vite 6.0.0
- **Routing:** React Router DOM 6.28.0 (nested layouts)
- **State:** Zustand 5.0.0 (auth store + cart store)
- **3D:** Three.js 0.170.0 + React Three Fiber + @react-three/drei
- **Styling:** Tailwind CSS 3.4.15 with custom color theme
- **i18n:** i18next 24.0.0 (IT, EN, FR, DE)
- **Icons:** Lucide React 0.460.0
- **PWA:** vite-plugin-pwa 0.21.0 with Workbox
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
5. (Optional) `database/07_euritmo_config.sql` — EDI config via DB

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
| `AuthController` | `/api/auth` | Mixed | Login, refresh, password reset |
| `ProdottiController` | `/api/prodotti` | Authenticated | Product catalog + filters |
| `ConfiguratoreController` | `/api/configuratore` | Authenticated | Fence BOM calculation |
| `OrdiniController` | `/api/ordini` | Authenticated | Orders/quotes CRUD + EDI |
| `ListiniController` | `/api/listini` | Super User | Price list management |
| `UtentiController` | `/api/utenti` | Admin | User CRUD + Excel import/export |
| `ImportController` | `/api/import` | Admin | Bulk data import/export |

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

### Database Schema Conventions
- **Italian naming**: table and column names use Italian (e.g., `Clienti`, `PuntiDiVendita`, `OrdPrevTst`)
- **Composite keys**: Used extensively (e.g., `PrdCod + LstCod` for prices, `OrdNum + RigaNum` for order lines)
- **Decimal precision**: Prices use `decimal(19,6)`, monetary amounts use `decimal(19,2)`, VAT rate uses `decimal(5,2)`
- **Soft conventions**: `ItemID` = customer code, `ItemIDSede` = sale point code, `PrdCod` = product code, `LstCod` = price list code
- **Order numbering**: `OrdNum` is auto-increment identity

### Key Business Entities
- **Clienti** → Customers (dealers/resellers)
- **PuntiDiVendita** → Sale points/branches per customer
- **Prodotti** → Product catalog with multilingual translations
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

### Accessibility (WCAG 2.1 AA)
- Skip links via `<SkipLinks />` component
- Focus trap in modals via `useFocusTrap` hook
- `aria-label`, `aria-hidden`, `aria-expanded`, `aria-invalid` on interactive elements
- Decorative icons get `aria-hidden="true"`
- Tables use `scope="col"` on headers
- Color contrast: use `primary-700` or darker for text (minimum 4.5:1 ratio)
- 3D canvas has text-based alternative (`Accessible3DCanvas` / `AccessibleConfigurator`)

## Key Business Logic

### Fence Configurator
The configurator (`ConfiguratoreService`) calculates a Bill of Materials (BOM) for custom fence assemblies:
- **Inputs:** post height (100/150/185/200 cm), slat type (persiana/pieno), colors (hex), mounting type (cemento/terreno), sections (length 10-150cm + angle)
- **Output:** Component list with quantities and prices from user's price list
- Components: posts (pali), slats (doghe), fasteners (fissaggi), spacers, caps, angular joints
- Products looked up by `DiBaCod` + `CfgColore` mapping

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

## Integration Phases (da_integrare)

The `da_integrare*` directories contain code for incremental feature phases not yet fully merged:

| Directory | Phase | Content |
|-----------|-------|---------|
| `da_integrare/` | Phase 6 | EURITMO EDI generation + email service |
| `da_integrare_7/` | Phase 7 | Complete i18n + WCAG 2.1 AA accessibility |
| `da_integrare_8/` | Phase 8 | PWA support + IIS production deployment |

Each contains a `README.md` with detailed integration instructions. Code from these phases has been largely integrated into the main `backend/` and `frontend/` directories already.

## Environment Configuration

### Key Config Sections (appsettings.json)
- `ConnectionStrings:DefaultConnection` — SQL Server connection string
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` — JWT authentication
- `Smtp:Host/Port/Username/Password/From` — Email sending
- `Euritmo:*` — EDI file generation parameters
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

## Important Notes for AI Assistants

1. **Language:** The codebase mixes Italian (domain terms, comments, DB columns) and English (code structure, framework conventions). Follow existing patterns — use Italian for domain-specific naming and English for technical code.

2. **No test framework** is currently set up. There are no unit tests or integration tests in the repository.

3. **Single-project backend:** All backend code lives in one ASP.NET Core project (`RecinzioniPortal.API`). There are no separate class libraries.

4. **Models in shared files:** Entities are grouped in `Entities.cs` and `AuthEntities.cs`, DTOs in `Dtos.cs` — add new models to the appropriate existing file rather than creating new ones.

5. **Frontend is plain JSX** (not TypeScript), despite `@types/react` being in devDependencies. Follow the JSX convention.

6. **Vite proxy:** In development, the frontend proxies `/api` requests to the backend. No need to hardcode backend URLs.

7. **PWA considerations:** Changes to static assets may require service worker cache invalidation. The `vite-plugin-pwa` handles this via content hashing.

8. **Database changes:** Write idempotent migration scripts (check `IF NOT EXISTS` before `ALTER TABLE`). Place them in `recinzioni-portal/scripts/`.

9. **i18n:** After adding any user-facing strings, add translations to all 4 locale files and verify with `node tools/check-i18n.js`.

10. **Decimal precision matters:** Always use `decimal(19,6)` for unit prices and `decimal(19,2)` for totals/amounts in SQL and C# models.
