# Documentazione Tecnica Completa — Recinzioni Portal

> **Versione:** 1.0 — Marzo 2026
> **Scopo:** Questo documento descrive in modo esaustivo l'architettura, il codice sorgente, la logica di business e le configurazioni del progetto **Recinzioni Portal**, un portale B2B per la gestione ordini di prodotti per recinzioni (Trafilplast). La documentazione è scritta affinché un'intelligenza artificiale o un team di sviluppo possa ricostruire il progetto in modo pressochè identico.

---

## Indice

1. [Panoramica del Progetto](#1-panoramica-del-progetto)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Struttura Repository](#3-struttura-repository)
4. [Database — Schema e Dati](#4-database--schema-e-dati)
5. [Backend — ASP.NET Core 8 Web API](#5-backend--aspnet-core-8-web-api)
6. [Frontend — React 18 SPA (Vite)](#6-frontend--react-18-spa-vite)
7. [Internazionalizzazione (i18n)](#7-internazionalizzazione-i18n)
8. [Accessibilità (WCAG 2.1 AA)](#8-accessibilità-wcag-21-aa)
9. [Progressive Web App (PWA)](#9-progressive-web-app-pwa)
10. [EURITMO EDI — Generazione file ordini](#10-euritmo-edi--generazione-file-ordini)
11. [Deployment](#11-deployment)
12. [Convenzioni e Regole di Codifica](#12-convenzioni-e-regole-di-codifica)

---

## 1. Panoramica del Progetto

### Cosa fa

**Recinzioni Portal** è un'applicazione web B2B full-stack per un'azienda italiana produttrice di recinzioni (Trafilplast). Permette a rivenditori e dealer di:

1. **Navigare** un catalogo prodotti multilingua (IT, EN, FR, DE)
2. **Configurare** recinzioni personalizzate con un visualizzatore 3D/2D interattivo
3. **Gestire** preventivi e ordini con flusso Carrello → Preventivo → Ordine → Invio
4. **Inviare** ordini al fornitore tramite standard EDI GS1 EURITMO ORDERS Release 25.1
5. **Generare** PDF di preventivi/ordini
6. **Importare/esportare** dati anagrafici via Excel

### Utenti del sistema

| Tipo | Codice | Accesso |
|------|--------|---------|
| Admin | 1 | Tutto: utenti, import, dati |
| Super User | 2 | Gestione listini prezzi per cliente assegnato |
| Capo Negozio | 3 | Ordini per il punto vendita assegnato |
| Operatore | 4 | Ordini solo per il proprio utente |

### Flusso ordini

```
Carrello (items da catalogo o configuratore)
    ↓ salva con dati fatturazione/consegna
Preventivo (Stato="Preventivo", FlagConferma=false)
    ↓ conferma
Ordine (Stato="Ordine", FlagConferma=true)
    ↓ invia al fornitore
Inviato (FlagInvioFornitore=true, file .edi generato + email)
```

---

## 2. Stack Tecnologico

### Backend
| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Runtime | .NET 8.0 | 8.0 |
| Framework | ASP.NET Core Web API | 8.0 |
| Linguaggio | C# 12 | - |
| ORM | Entity Framework Core | 8.0.11 |
| Database | Microsoft SQL Server | Latin1_General_CI_AS |
| Auth | JWT Bearer (HS256) | 8.0.11 |
| Password | BCrypt.Net-Next | 4.0.3 |
| PDF | QuestPDF | 2026.2.1 |
| Excel | ClosedXML | 0.104.2 |
| EDI | Custom EURITMO generator | - |
| API Docs | Swashbuckle (Swagger) | 6.9.0 |

### Frontend
| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Framework | React | 18.3.1 |
| Build | Vite | 6.0.0 |
| Routing | React Router DOM | 6.28.0 |
| State | Zustand | 5.0.0 |
| 3D | Three.js + React Three Fiber | 0.170.0 |
| CSS | Tailwind CSS | 3.4.15 |
| i18n | i18next | 24.0.0 |
| Icone | Lucide React | 0.460.0 |
| PWA | vite-plugin-pwa (Workbox) | 0.21.0 |
| Notifiche | react-hot-toast | 2.4.1 |

### File .csproj (NuGet packages)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>RecinzioniPortal.API</RootNamespace>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <PackageReference Include="ClosedXML" Version="0.104.2" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.11" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.11" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.11" />
    <PackageReference Include="QuestPDF" Version="2026.2.1" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.9.0" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.3.0" />
  </ItemGroup>
</Project>
```

### package.json (npm dependencies)

```json
{
  "name": "recinzioni-portal-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^9.117.0",
    "@react-three/fiber": "^8.17.10",
    "i18next": "^24.0.0",
    "i18next-browser-languagedetector": "^8.0.0",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.4.1",
    "react-i18next": "^15.1.0",
    "react-router-dom": "^6.28.0",
    "three": "^0.170.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "terser": "^5.36.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "workbox-window": "^7.3.0"
  }
}
```

---

## 3. Struttura Repository

```
TrafilplastNew/
├── CLAUDE.md                          # Istruzioni AI
├── DOCUMENTAZIONE_TECNICA.md          # Questo file
├── README.md
├── .gitignore
└── recinzioni-portal/
    ├── backend/
    │   └── RecinzioniPortal.API/
    │       ├── RecinzioniPortal.API.csproj
    │       ├── Program.cs             # Startup, DI, middleware
    │       ├── Controllers/
    │       │   ├── HealthController.cs
    │       │   ├── AuthController.cs
    │       │   ├── ProdottiController.cs
    │       │   ├── ConfiguratoreController.cs
    │       │   ├── OrdiniController.cs
    │       │   ├── ListiniController.cs
    │       │   ├── UtentiController.cs
    │       │   └── ImportController.cs
    │       ├── Models/
    │       │   ├── Entities.cs        # Tutte le entity EF Core
    │       │   └── AuthEntities.cs    # Entity sicurezza
    │       ├── DTOs/
    │       │   └── Dtos.cs            # Tutti i DTO (record)
    │       ├── Services/
    │       │   ├── AuthService.cs
    │       │   ├── ConfiguratoreService.cs
    │       │   ├── EuritmoService.cs
    │       │   ├── EmailService.cs
    │       │   └── PdfService.cs
    │       ├── Data/
    │       │   └── AppDbContext.cs     # EF Core DbContext
    │       ├── wwwroot/               # Static files
    │       │   └── euritmo/           # Archivio file EDI
    │       ├── appsettings.json
    │       ├── appsettings.Development.json
    │       ├── appsettings.Production.json
    │       └── web.config             # IIS
    ├── frontend/
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── tailwind.config.js
    │   ├── src/
    │   │   ├── main.jsx
    │   │   ├── App.jsx
    │   │   ├── index.css
    │   │   ├── services/api.js
    │   │   ├── store/store.js
    │   │   ├── utils/formatters.js
    │   │   ├── hooks/
    │   │   │   ├── useFocusTrap.js
    │   │   │   └── useOnlineStatus.js
    │   │   ├── components/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── SkipLinks.jsx
    │   │   │   ├── InstallPrompt.jsx
    │   │   │   ├── UpdatePrompt.jsx
    │   │   │   ├── OfflineBanner.jsx
    │   │   │   ├── ChangePasswordModal.jsx
    │   │   │   ├── ProductDetailModal.jsx
    │   │   │   ├── EuritmoPreviewModal.jsx
    │   │   │   ├── Accessible3DCanvas.jsx
    │   │   │   ├── AccessibleConfigurator.jsx
    │   │   │   ├── PasswordStrengthIndicator.jsx
    │   │   │   └── configurator/
    │   │   │       ├── FenceScene3D.jsx
    │   │   │       └── PlanView2D.jsx
    │   │   ├── pages/
    │   │   │   ├── LoginPage.jsx
    │   │   │   ├── ForgotPasswordPage.jsx
    │   │   │   ├── ResetPasswordPage.jsx
    │   │   │   ├── OfflinePage.jsx
    │   │   │   ├── CatalogPage.jsx
    │   │   │   ├── ConfiguratorPage.jsx
    │   │   │   ├── CartPage.jsx
    │   │   │   ├── QuoteFormPage.jsx
    │   │   │   ├── OrdersPage.jsx
    │   │   │   ├── PriceListsPage.jsx
    │   │   │   └── admin/
    │   │   │       ├── UsersPage.jsx
    │   │   │       └── ImportPage.jsx
    │   │   └── i18n/
    │   │       ├── i18n.js
    │   │       └── locales/
    │   │           ├── it.json
    │   │           ├── en.json
    │   │           ├── fr.json
    │   │           └── de.json
    ├── database/
    │   ├── 01_create_database.sql
    │   ├── 02_auth_tables.sql
    │   └── 07_euritmo_config.sql
    ├── scripts/
    │   ├── deploy.sh
    │   ├── deploy.ps1
    │   ├── migration_add_prodotti_config.sql
    │   ├── migration_add_clienti_address.sql
    │   └── migration_align_configurator_products.sql
    └── tools/
        └── check-i18n.js
```

---

## 4. Database — Schema e Dati

### 4.1 Collation e Naming

- **Collation:** `Latin1_General_CI_AS` (case-insensitive per l'italiano)
- **Naming:** Italiano per tabelle e colonne (es. `Clienti`, `PuntiDiVendita`, `OrdPrevTst`)
- **Chiavi composite:** usate estensivamente (es. `PrdCod + LstCod` per prezzi)
- **Precisione decimale:**
  - Prezzi unitari: `decimal(19,6)`
  - Importi/totali: `decimal(19,2)`
  - Aliquota IVA: `decimal(5,2)`

### 4.2 Tabelle — Schema completo

#### Clienti (Anagrafica clienti/dealer)

```sql
CREATE TABLE [dbo].[Clienti](
    [ItemID]     [varchar](16)   NOT NULL,  -- Codice cliente (PK)
    [ItemDes]    [nvarchar](256) NULL,       -- Ragione sociale
    [PIva]       [varchar](16)   NULL,       -- Partita IVA
    [CFis]       [varchar](16)   NULL,       -- Codice fiscale
    [Ind]        [varchar](256)  NULL,       -- Indirizzo sede legale
    [Cap]        [varchar](16)   NULL,       -- CAP
    [Loc]        [varchar](128)  NULL,       -- Località
    [Pro]        [varchar](16)   NULL,       -- Provincia
    [LstCod]     [varchar](32)   NULL,       -- Listino personalizzato
    [LstCodPubb] [varchar](32)   NULL,       -- Listino pubblico
    [PagCod]     [varchar](16)   NULL,       -- Codice pagamento
    CONSTRAINT [PK_Clienti] PRIMARY KEY ([ItemID])
)
```

#### PuntiDiVendita (Sedi/filiali per cliente)

```sql
CREATE TABLE [dbo].[PuntiDiVendita](
    [ItemID]     [varchar](16)   NOT NULL,  -- FK a Clienti
    [ItemIDSede] [varchar](16)   NOT NULL,  -- Codice sede
    [ItemDes]    [nvarchar](256) NULL,       -- Nome sede
    [Ind]        [varchar](256)  NULL,       -- Indirizzo
    [Cap]        [varchar](16)   NULL,
    [Loc]        [varchar](128)  NULL,
    [Pro]        [varchar](16)   NULL,
    [Reg]        [varchar](32)   NULL,       -- Regione
    [Naz]        [varchar](64)   NULL,       -- Nazione
    [LstCod]     [varchar](32)   NULL,       -- Listino personalizzato sede
    [LstCodPubb] [varchar](32)   NULL,       -- Listino pubblico sede
    [PagCod]     [varchar](16)   NULL,
    [Tel]        [varchar](32)   NULL,
    [Mail]       [varchar](64)   NULL,
    CONSTRAINT [PK_PuntiDiVendita] PRIMARY KEY ([ItemID], [ItemIDSede]),
    FOREIGN KEY ([ItemID]) REFERENCES [Clienti]([ItemID])
)
```

#### Utenti

```sql
CREATE TABLE [dbo].[Utenti](
    [UserID]      [smallint]      NOT NULL,  -- PK
    [UserLogin]   [varchar](32)   NULL,
    [Password]    [varchar](128)  NULL,       -- BCrypt hash (cost 12)
    [UserName]    [varchar](64)   NULL,
    [UserType]    [tinyint]       NULL,       -- 1=Admin, 2=SuperUser, 3=Capo, 4=Operatore
    [MailAddress] [varchar](64)   NULL,
    [ItemID]      [varchar](16)   NULL,       -- FK cliente assegnato
    [ItemIDSede]  [varchar](16)   NULL,       -- FK sede assegnata
    CONSTRAINT [PK_Utenti] PRIMARY KEY ([UserID])
)
```

#### Prodotti

```sql
CREATE TABLE [dbo].[Prodotti](
    [PrdCod]    [varchar](32)   NOT NULL,  -- PK (es. "PAL-150-BI")
    [PrdDes]    [nvarchar](256) NULL,       -- Descrizione italiana
    [PrdUm]     [varchar](8)    NULL,       -- Unità misura (PZ, MT, KG)
    [PosArc]    [varchar](32)   NULL,       -- Posizione archivio
    [PrvCla]    [varchar](8)    NULL,       -- Classe provenienza
    [SitCod]    [varchar](32)   NULL,       -- Codice sito
    [GrpCod]    [varchar](32)   NULL,       -- Gruppo
    [CatCod]    [varchar](32)   NULL,       -- Categoria
    [TreeCod]   [varchar](16)   NULL,       -- Codice albero
    [FamCod]    [varchar](32)   NULL,       -- Famiglia
    [DiBaCod]   [varchar](32)   NULL,       -- Codice Distinta Base (es. "PAL-150")
    [CfgTipo]   [nvarchar](32)  NULL,       -- Tipo configurazione (es. "recinzione")
    [CfgColore] [nvarchar](16)  NULL,       -- Codice colore (es. "BI", "MA", "AN")
    CONSTRAINT [PK_Prodotti] PRIMARY KEY ([PrdCod])
)
```

**Nota importante su DiBaCod e CfgColore:**
- `DiBaCod` identifica il *ruolo* del componente nella distinta base (es. `PAL-150` = palo altezza 150)
- `CfgColore` identifica la variante colore (es. `BI` = Bianco melange)
- Il configuratore cerca i prodotti con: `WHERE DiBaCod = @diBaCod AND CfgColore = @colore`
- I componenti senza colore (fissaggi, cover, angolari) hanno `CfgColore = NULL`

#### ProdottiTrad (Traduzioni)

```sql
CREATE TABLE [dbo].[ProdottiTrad](
    [PrdCod]    [varchar](32)   NOT NULL,
    [LangCode]  [varchar](5)    NOT NULL,  -- 'en', 'fr', 'de'
    [PrdDes]    [nvarchar](256) NULL,       -- Descrizione tradotta
    CONSTRAINT [PK_ProdottiTrad] PRIMARY KEY ([PrdCod], [LangCode]),
    FOREIGN KEY ([PrdCod]) REFERENCES [Prodotti]([PrdCod])
)
```

#### Prezzi

```sql
CREATE TABLE [dbo].[Prezzi](
    [PrdCod]  [varchar](32)   NOT NULL,
    [LstCod]  [varchar](32)   NOT NULL,  -- Codice listino
    [PrdPrz]  [decimal](19,6) NULL,       -- Prezzo unitario
    CONSTRAINT [PK_Prezzi] PRIMARY KEY ([PrdCod], [LstCod])
)
```

#### LstTst (Testata listini — validità)

```sql
CREATE TABLE [dbo].[LstTst](
    [LstCod]    [varchar](32) NOT NULL,
    [ValidoDal] [date]        NOT NULL,
    [ValidoAl]  [date]        NOT NULL,
    CONSTRAINT [PK_LstTst] PRIMARY KEY ([LstCod], [ValidoDal], [ValidoAl])
)
```

#### OrdPrevTst (Testata ordini/preventivi)

```sql
CREATE TABLE [dbo].[OrdPrevTst](
    [OrdNum]            [int] IDENTITY(1,1) NOT NULL,  -- Auto-increment
    [OrdData]           [datetime]      NOT NULL DEFAULT GETDATE(),
    [Stato]             [varchar](16)   NOT NULL DEFAULT 'Carrello',
    [UserID]            [smallint]      NULL,
    [ItemID]            [varchar](16)   NULL,
    [ItemIDSede]        [varchar](16)   NULL,
    -- Fatturazione
    [FattRagSoc]        [nvarchar](256) NULL,
    [FattIndirizzo]     [nvarchar](256) NULL,
    [FattCap]           [varchar](16)   NULL,
    [FattCitta]         [nvarchar](128) NULL,
    [FattProvincia]     [varchar](16)   NULL,
    [FattPIva]          [varchar](16)   NULL,
    [FattCFis]          [varchar](16)   NULL,
    -- Consegna
    [ConsRagSoc]        [nvarchar](256) NULL,
    [ConsIndirizzo]     [nvarchar](256) NULL,
    [ConsCap]           [varchar](16)   NULL,
    [ConsCitta]         [nvarchar](128) NULL,
    [ConsProvincia]     [varchar](16)   NULL,
    -- Pagamento
    [PagCod]            [varchar](16)   NULL,
    [PagDescrizione]    [nvarchar](128) NULL,
    -- Totali
    [Subtotale]         [decimal](19,2) NOT NULL DEFAULT 0,
    [AliquotaIVA]       [decimal](5,2)  NOT NULL DEFAULT 22.00,
    [ImportoIVA]        [decimal](19,2) NOT NULL DEFAULT 0,
    [Totale]            [decimal](19,2) NOT NULL DEFAULT 0,
    [Note]              [nvarchar](1000) NULL,
    [FlagConferma]      [bit]           NOT NULL DEFAULT 0,
    [FlagInvioFornitore] [bit]          NOT NULL DEFAULT 0,
    [DataInvioFornitore] [datetime]     NULL,
    CONSTRAINT [PK_OrdPrevTst] PRIMARY KEY ([OrdNum])
)
```

#### OrdPrevDett (Dettaglio righe ordine)

```sql
CREATE TABLE [dbo].[OrdPrevDett](
    [OrdNum]          [int]           NOT NULL,
    [RigaNum]         [int]           NOT NULL,
    [RigaPadre]       [int]           NULL,       -- NULL=riga padre, valorizzato=componente figlio
    [PrdCod]          [varchar](32)   NULL,
    [PrdDes]          [nvarchar](256) NULL,
    [PrdUm]           [varchar](8)    NULL,
    [Quantita]        [decimal](19,3) NULL,
    [PrezzoUnitario]  [decimal](19,6) NULL,
    [PrezzoTotale]    [decimal](19,2) NULL,
    CONSTRAINT [PK_OrdPrevDett] PRIMARY KEY ([OrdNum], [RigaNum]),
    FOREIGN KEY ([OrdNum]) REFERENCES [OrdPrevTst]([OrdNum])
)
```

#### OrdPrevConfig (Configurazione recinzione per riga)

```sql
CREATE TABLE [dbo].[OrdPrevConfig](
    [OrdNum]         [int]           NOT NULL,
    [RigaNum]        [int]           NOT NULL,
    [ColoreDoghe]    [varchar](16)   NULL,   -- Hex colore doghe
    [ColorePali]     [varchar](16)   NULL,   -- Hex colore pali
    [StessoColore]   [bit]           NULL DEFAULT 1,
    [Fissaggio]      [varchar](16)   NULL,   -- "cemento" | "terreno"
    [TipoDoghe]      [varchar](16)   NULL,   -- "persiana" | "pieno"
    [AltezzaPali]    [int]           NULL,    -- 100, 150, 185, 200
    [NumeroDoghe]    [int]           NULL,
    [NumeroSezioni]  [int]           NULL,
    [SezioniJson]    [nvarchar](max) NULL,    -- JSON array delle sezioni
    CONSTRAINT [PK_OrdPrevConfig] PRIMARY KEY ([OrdNum], [RigaNum]),
    FOREIGN KEY ([OrdNum], [RigaNum]) REFERENCES [OrdPrevDett]([OrdNum], [RigaNum])
)
```

#### Tabelle Auth (02_auth_tables.sql)

```sql
CREATE TABLE [dbo].[PasswordResetTokens](
    [TokenID]   [int] IDENTITY(1,1) NOT NULL,
    [UserID]    [smallint] NOT NULL,
    [Token]     [varchar](128) NOT NULL,
    [ExpiresAt] [datetime] NOT NULL,
    [CreatedAt] [datetime] NOT NULL DEFAULT GETUTCDATE(),
    [UsedAt]    [datetime] NULL,
    CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([TokenID]),
    FOREIGN KEY ([UserID]) REFERENCES [Utenti]([UserID]) ON DELETE CASCADE
)

CREATE TABLE [dbo].[LoginAttempts](
    [AttemptID]   [int] IDENTITY(1,1) NOT NULL,
    [Username]    [varchar](32) NOT NULL,
    [IpAddress]   [varchar](45) NULL,
    [AttemptedAt] [datetime] NOT NULL DEFAULT GETUTCDATE(),
    [Success]     [bit] NOT NULL DEFAULT 0,
    CONSTRAINT [PK_LoginAttempts] PRIMARY KEY ([AttemptID])
)
```

### 4.3 Catalogo Prodotti — Struttura componenti recinzione

I prodotti seguono una struttura specifica per il configuratore di recinzioni:

| Componente | DiBaCod | CfgColore | PrdCod esempio | Descrizione |
|------------|---------|-----------|----------------|-------------|
| Palo montante | PAL-{altezza} | BI/MA/AN/GR/VE/RO | PAL-150-BI | Palo H150 cm Bianco |
| Doga orizzontale | DOG-150 | BI/MA/AN/GR/VE/RO | DOG-150-AN | Doga L150 cm Antracite |
| Kit fissaggio cemento | FIX-CEM | NULL | FIX-CEM-01 | Senza colore |
| Kit fissaggio terreno | FIX-TER | NULL | FIX-TER-01 | Senza colore |
| Cover scanalatura | COV-{altezza} | NULL | COV-150-01 | Senza colore |
| Cappellotto palo | ACC-CAP | BI/MA/AN/GR/VE/RO | ACC-CAP-BI | Con colore |
| Distanziale persiana | DST-PER | NULL | DST-PER-01 | Senza colore |
| Giunzione angolare | ACC-ANG | NULL | ACC-ANG-90 | 90 gradi |
| Recinzione configurata | - | - | CONF-REC | Prodotto padre (CfgTipo="recinzione") |

**Colori disponibili:**
| Codice | Nome | Hex |
|--------|------|-----|
| BI | Bianco melange | #E8E0D0 |
| MA | Marrone | #8B4513 |
| AN | Antracite | #4A4A4A |
| GR | Grigio | (legacy) |
| VE | Verde | (legacy) |
| RO | Rosso mattone | (legacy) |

**Altezze pali e numero doghe:**
| Altezza (cm) | Doghe Persiana | Doghe Pieno |
|-------------|----------------|-------------|
| 100 | 8 | 9 |
| 150 | 12 | 14 |
| 185 | 15 | 17 |
| 200 | 16 | 18 |

### 4.4 Risoluzione Listino Prezzi (Cascata)

L'algoritmo per determinare il listino dell'utente segue questa priorità:

1. Listino personalizzato per sede: `LstCod = "{ItemID}_{ItemIDSede}"` con date valide
2. Listino default del punto vendita (`PdV.LstCod`) con date valide
3. Listino pubblico del PdV (`PdV.LstCodPubb`)
4. Listino default del cliente (`Cliente.LstCod` o `Cliente.LstCodPubb`)
5. **Fallback:** `LSTPUB001`

### 4.5 Dati Seed

Il database include dati di esempio:
- **Admin:** login `admin`, password `Admin123!`
- **Cliente:** CLI001 "Centro Edile Demo Srl"
- **Punto vendita:** SEDE01 "Filiale Padova"
- **Utenti demo:** SuperUser, Manager, Operatore (tutti password `Admin123!`)
- **Prodotti:** 40+ articoli con traduzioni EN/FR/DE
- **Listino pubblico:** LSTPUB001 valido 2026-01-01 / 2026-12-31

---

## 5. Backend — ASP.NET Core 8 Web API

### 5.1 Program.cs — Startup completo

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ====== Database ======
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ====== JWT Authentication ======
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyThatIsAtLeast32Characters!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "RecinzioniPortal",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "RecinzioniPortal",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ====== Services ======
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ConfiguratoreService>();
builder.Services.AddScoped<EuritmoService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PdfService>();

// ====== CORS ======
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Frontend:Url"] ?? "http://localhost:5173",
                "http://localhost:5173",
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ====== Swagger ======
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Recinzioni Portal API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Inserire il token JWT con prefisso 'Bearer '",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// QuestPDF Community license
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
QuestPDF.Settings.CheckIfAllTextGlyphsAreAvailable = false;

var app = builder.Build();

// ====== Pipeline ======
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html"); // SPA fallback
app.Run();
```

### 5.2 Entity Models (Entities.cs)

Le entity EF Core mappano le tabelle SQL Server. Tutte le entity sono in un singolo file `Models/Entities.cs`:

- **Cliente** → tabella `Clienti`
- **PuntoDiVendita** → tabella `PuntiDiVendita` (chiave composta ItemID + ItemIDSede)
- **Utente** → tabella `Utenti`
- **Prodotto** → tabella `Prodotti` (include DiBaCod, CfgTipo, CfgColore)
- **ProdottoTrad** → tabella `ProdottiTrad` (chiave composta PrdCod + LangCode)
- **Prezzo** → tabella `Prezzi` (chiave composta PrdCod + LstCod)
- **ListinoTestata** → tabella `LstTst` (chiave composta LstCod + ValidoDal + ValidoAl)
- **OrdineTestata** → tabella `OrdPrevTst` (OrdNum auto-increment)
- **OrdineDettaglio** → tabella `OrdPrevDett` (chiave composta OrdNum + RigaNum)
- **OrdineConfig** → tabella `OrdPrevConfig` (chiave composta OrdNum + RigaNum)
- **RefreshToken** → tabella `RefreshTokens`
- **NotificaConfig** → tabella `NotificheConfig`

Le entity auth sono in `Models/AuthEntities.cs`:
- **PasswordResetToken** → tabella `PasswordResetTokens`
- **LoginAttempt** → tabella `LoginAttempts`

### 5.3 AppDbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clienti => Set<Cliente>();
    public DbSet<PuntoDiVendita> PuntiDiVendita => Set<PuntoDiVendita>();
    public DbSet<Utente> Utenti => Set<Utente>();
    public DbSet<Prodotto> Prodotti => Set<Prodotto>();
    public DbSet<ProdottoTrad> ProdottiTrad => Set<ProdottoTrad>();
    public DbSet<Prezzo> Prezzi => Set<Prezzo>();
    public DbSet<ListinoTestata> ListiniTestata => Set<ListinoTestata>();
    public DbSet<OrdineTestata> OrdiniTestata => Set<OrdineTestata>();
    public DbSet<OrdineDettaglio> OrdiniDettaglio => Set<OrdineDettaglio>();
    public DbSet<OrdineConfig> OrdiniConfig => Set<OrdineConfig>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<NotificaConfig> NotificheConfig => Set<NotificaConfig>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Chiavi composite
        modelBuilder.Entity<PuntoDiVendita>().HasKey(p => new { p.ItemID, p.ItemIDSede });
        modelBuilder.Entity<ProdottoTrad>().HasKey(p => new { p.PrdCod, p.LangCode });
        modelBuilder.Entity<Prezzo>().HasKey(p => new { p.PrdCod, p.LstCod });
        modelBuilder.Entity<ListinoTestata>().HasKey(l => new { l.LstCod, l.ValidoDal, l.ValidoAl });
        modelBuilder.Entity<OrdineDettaglio>().HasKey(d => new { d.OrdNum, d.RigaNum });
        modelBuilder.Entity<OrdineConfig>().HasKey(c => new { c.OrdNum, c.RigaNum });

        // Relazioni
        modelBuilder.Entity<PuntoDiVendita>()
            .HasOne(p => p.Cliente).WithMany(c => c.PuntiVendita).HasForeignKey(p => p.ItemID);
        modelBuilder.Entity<ProdottoTrad>()
            .HasOne(t => t.Prodotto).WithMany(p => p.Traduzioni).HasForeignKey(t => t.PrdCod);
        modelBuilder.Entity<OrdineDettaglio>()
            .HasOne(d => d.Testata).WithMany(t => t.Righe).HasForeignKey(d => d.OrdNum);
        modelBuilder.Entity<OrdineConfig>()
            .HasOne<OrdineDettaglio>().WithOne()
            .HasForeignKey<OrdineConfig>(c => new { c.OrdNum, c.RigaNum })
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### 5.4 API Endpoints — Mappa completa

#### HealthController — `/api/health`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| GET | `/api/health` | Anonymous | Health check con stato DB |

#### AuthController — `/api/auth`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | Anonymous | Login con brute-force protection (5 tentativi/15min) |
| POST | `/api/auth/refresh` | Anonymous | Refresh JWT token |
| GET | `/api/auth/me` | Authenticated | Utente corrente da JWT |
| POST | `/api/auth/forgot-password` | Anonymous | Richiedi reset password via email |
| GET | `/api/auth/validate-reset-token` | Anonymous | Valida token reset |
| POST | `/api/auth/reset-password` | Anonymous | Reset password con token |
| POST | `/api/auth/change-password` | Authenticated | Cambia password (con verifica attuale) |
| GET | `/api/auth/password-rules` | Anonymous | Regole complessità password |

#### ProdottiController — `/api/prodotti`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| GET | `/api/prodotti` | Authenticated | Lista prodotti paginata con filtri, ricerca, ordinamento |
| GET | `/api/prodotti/{prdCod}` | Authenticated | Dettaglio prodotto con traduzioni e prezzo |
| GET | `/api/prodotti/filtri/categorie` | Authenticated | Categorie con conteggio |
| GET | `/api/prodotti/filtri/famiglie` | Authenticated | Famiglie (filtro categoria opzionale) |
| GET | `/api/prodotti/filtri/gruppi` | Authenticated | Gruppi (filtro categoria/famiglia) |
| GET | `/api/prodotti/filtri` | Authenticated | Tutti i filtri in una chiamata |

#### ConfiguratoreController — `/api/configuratore`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| POST | `/api/configuratore/distinta-base` | Authenticated | Calcola distinta base recinzione |
| GET | `/api/configuratore/info` | Authenticated | Colori, altezze, limiti, tabella doghe |
| POST | `/api/configuratore/valida` | Authenticated | Valida richiesta configurazione |

#### OrdiniController — `/api/ordini`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| GET | `/api/ordini` | Authenticated | Lista ordini con filtri stato, paginazione |
| GET | `/api/ordini/{ordNum}` | Authenticated | Dettaglio ordine con righe gerarchiche |
| GET | `/api/ordini/dati-anagrafica` | Authenticated | Dati pre-compilati fatturazione/consegna |
| POST | `/api/ordini` | Authenticated | Crea preventivo da carrello |
| PUT | `/api/ordini/{ordNum}` | Authenticated | Modifica preventivo non confermato |
| PUT | `/api/ordini/{ordNum}/conferma` | Authenticated | Conferma → ordine |
| PUT | `/api/ordini/{ordNum}/invia` | Authenticated | Invia al fornitore (EDI + email) |
| GET | `/api/ordini/{ordNum}/euritmo` | Authenticated | Download file .edi |
| GET | `/api/ordini/{ordNum}/euritmo/preview` | Authenticated | Anteprima contenuto EDI |
| GET | `/api/ordini/{ordNum}/pdf` | Authenticated | Genera PDF preventivo/ordine |
| DELETE | `/api/ordini/{ordNum}` | Authenticated | Elimina ordine non confermato |
| DELETE | `/api/ordini/{ordNum}/righe/{rigaNum}` | Authenticated | Elimina singola riga |

#### ListiniController — `/api/listini`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| GET | `/api/listini/puntivendita` | SuperUser (2) | Punti vendita con info listino |
| GET | `/api/listini/confronto/{itemIdSede}` | SuperUser (2) | Confronto prezzi custom vs pubblico |
| GET | `/api/listini/{lstCod}` | SuperUser (2) | Vista listino con ricerca/paginazione |
| POST | `/api/listini/crea/{itemIdSede}` | SuperUser (2) | Crea listino personalizzato |
| PUT | `/api/listini/{lstCod}/prezzo` | SuperUser (2) | Aggiorna singolo prezzo |
| PUT | `/api/listini/{lstCod}/validita` | SuperUser (2) | Aggiorna date validità |
| DELETE | `/api/listini/{lstCod}` | SuperUser (2) | Elimina listino custom |
| POST | `/api/listini/{lstCod}/reset` | SuperUser (2) | Reset prezzi a listino pubblico |

#### UtentiController — `/api/utenti`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| GET | `/api/utenti` | Admin (1) | Lista utenti con ricerca/filtri |
| GET | `/api/utenti/{id}` | Admin (1) | Dettaglio utente |
| POST | `/api/utenti` | Admin (1) | Crea utente |
| PUT | `/api/utenti/{id}` | Admin (1) | Modifica utente |
| DELETE | `/api/utenti/{id}` | Admin (1) | Elimina utente |
| GET | `/api/utenti/export` | Admin (1) | Esporta in Excel |
| POST | `/api/utenti/import` | Admin (1) | Importa da Excel (merge/replace) |

#### ImportController — `/api/import`
| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| POST | `/api/import/prodotti` | Admin (1) | Import prodotti con traduzioni |
| POST | `/api/import/prezzi` | Admin (1) | Import prezzi |
| POST | `/api/import/clienti` | Admin (1) | Import clienti |
| POST | `/api/import/puntivendita` | Admin (1) | Import punti vendita |
| GET | `/api/import/{entità}` | Admin (1) | Vista dati con paginazione |
| GET | `/api/import/{entità}/export` | Admin (1) | Export Excel |
| GET | `/api/import/counts` | Admin (1) | Conteggi per dashboard |

### 5.5 Servizi — Logica di Business

#### AuthService

Gestisce autenticazione JWT, reset password, protezione brute-force.

**Costanti:**
- `MaxFailedAttempts = 5`
- `LockoutWindow = 15 minuti`
- `ResetTokenExpiry = 24 ore`
- `JWT Expiry = 8 ore`
- `Refresh Token Expiry = 30 giorni`

**Claims JWT:** UserID, UserLogin, UserType, ItemID, ItemIDSede, UserName

**Validazione password:** 8+ caratteri, maiuscola, minuscola, cifra, carattere speciale.

#### ConfiguratoreService

Motore di calcolo distinta base (BOM) per recinzioni personalizzate.

**Algoritmo CalcolaDistintaBase:**
1. Determina codici colore da hex (MappaColori: #E8E0D0→BI, #8B4513→MA, #4A4A4A→AN)
2. Calcola quantità: pali = sezioni+1, doghe = doghePerSezione × sezioni, fissaggi = pali, cappellotti = pali
3. Distanziatori: 2 × sezioni (solo tipo "persiana")
4. Cover: pali + 2 (terminali hanno 2 cover, intermedi 1)
5. Angolari: 1 per sezione con angolo ≠ 0°
6. Risolve codici prodotto dal DB tramite `DiBaCod + CfgColore`
7. Recupera prezzi dal listino utente (con fallback a LSTPUB001)
8. Restituisce lista ComponenteDistinta con quantità, prezzi unitari e totali

**Limiti configuratore:**
- Lunghezza sezione: 10–158 cm
- Max sezioni: 20
- Angoli: 0° (dritto) o 90°
- Altezze: 100, 150, 185, 200 cm

#### EuritmoService

Genera file EDI EURITMO ORDERS Release 25.1 (formato record a lunghezza fissa).

**Record generati:**
| Tipo | Bytes | Descrizione |
|------|-------|-------------|
| BGM | 168 | Testata documento |
| NAS | 564 | Fornitore/Supplier |
| CTA | 153 | Contatto fornitore (opzionale) |
| NAB | 305 | Buyer/Emittente ordine |
| NAD | 305 | Punto consegna |
| NAI | 305 | Intestatario fattura |
| DTM | 33 | Data consegna (ordine + 7gg) |
| FTX | 216 | Note (opzionale) |
| PAT | 198 | Termini pagamento (opzionale) |
| LIN | 295 | Riga prodotto (solo righe padre) |
| CNT | 36 | Sommario (conteggio righe) |

**Formattazione campi:**
- `A(string, len)`: stringa left-pad/troncata a lunghezza fissa
- `N(int, len)`: intero zero-padded
- `Dec(decimal, iLen, dLen)`: decimale a punto fisso
- `D(DateTime)`: formato yyyyMMdd
- `UM(string)`: conversione unità (PZ→PCE, MT→MTR, KG→KGM)

#### EmailService

Invio email SMTP per ordini e recupero password con template HTML responsive.

#### PdfService

Genera PDF A4 con QuestPDF: intestazione con logo, dati fatturazione/consegna, tabella righe con gerarchia padre/figli, totali con IVA 22%.

### 5.6 Configurazione (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RecinzioniPortal;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "RecinzioniPortalSuperSecretKey2026!MustBeAtLeast32Chars",
    "Issuer": "RecinzioniPortal",
    "Audience": "RecinzioniPortal"
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "Username": "noreply@recinzioni.it",
    "Password": "your-smtp-password",
    "From": "noreply@portale-recinzioni.it",
    "FromName": "Portale Recinzioni",
    "UseSsl": true
  },
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
  "Frontend": { "Url": "http://localhost:5173" },
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
  "AllowedHosts": "*"
}
```

### 5.7 IIS web.config

Configurazione per deployment su Windows Server/IIS:
- Compressione gzip per JS, CSS, JSON, SVG
- MIME types per `.webmanifest`, `.woff2`
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Cache 1 anno per asset con hash; no-cache per service worker e manifest
- ASP.NET Core hosting InProcess

---

## 6. Frontend — React 18 SPA (Vite)

### 6.1 Architettura generale

- **Build tool:** Vite 6.0 con plugin React e PWA
- **Styling:** Tailwind CSS 3.4 con tema custom (colori primari rosso/cremisi)
- **State:** Zustand con 2 store (auth + cart)
- **Routing:** React Router DOM 6 con lazy loading
- **HTTP:** Singleton ApiService con auto-refresh JWT su 401
- **i18n:** i18next con 4 lingue (IT, EN, FR, DE)

### 6.2 vite.config.js

Configurazione chiave:
- **Proxy dev:** `/api` → `http://localhost:5000`
- **PWA:** vite-plugin-pwa con manifest, icone, Workbox runtime caching
- **Code splitting manuale:** vendor-react, vendor-three, vendor-ui, vendor-i18n
- **Minificazione:** Terser con rimozione console/debugger in produzione

**Strategie cache Workbox:**
- `StaleWhileRevalidate` per `/api/prodotti`, `/api/import/counts`
- `NetworkFirst` per `/api/ordini`, `/api/auth`, `/api/configuratore`, `/api/listini`
- `CacheFirst` per immagini e font (max 50 entries, 30 giorni)

### 6.3 Tailwind Config

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f4', 100: '#fce4e8', 200: '#facdd5',
          300: '#f6a7b5', 400: '#f0758e', 500: '#e54b6b',
          600: '#d12a55', 700: '#b01e45', 800: '#941c3e',
          900: '#7e1b39', 950: '#450a1c',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d',
        },
      },
    },
  },
}
```

### 6.4 Classi CSS custom (index.css)

```css
.btn-primary    { @apply bg-primary-700 text-white px-4 py-2 rounded-lg ... }
.btn-secondary  { @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-lg ... }
.btn-success    { @apply bg-success-600 text-white px-4 py-2 rounded-lg ... }
.btn-danger     { @apply bg-red-600 text-white px-4 py-2 rounded-lg ... }
.input-field    { @apply w-full px-3 py-2 border rounded-lg ... }
.card           { @apply bg-white rounded-xl shadow-sm border p-6 ... }
```

### 6.5 API Client (services/api.js)

Singleton HTTP con:
- Token JWT in `sessionStorage` (sessione) o `localStorage` (remember-me)
- Auto-refresh su risposta 401 usando il refresh token
- Metodi: `get()`, `post()`, `put()`, `del()`, `upload()`, `downloadBlob()`
- FormData automatico per file upload

### 6.6 State Management (store/store.js)

**useAuthStore:**
- `user`, `isAuthenticated`, `loading`
- `login(username, password, rememberMe)` → chiama `/api/auth/login`
- `logout()` → pulisce token e stato
- `checkAuth()` → verifica `/api/auth/me` all'avvio
- `changePassword(currentPassword, newPassword)` → chiama `/api/auth/change-password`

**useCartStore:**
- `items[]`, `addItem(product)`, `addConfiguredItem(config)`, `removeItem(id)`
- `updateQuantity(id, quantity)`, `clearCart()`
- `getSubtotal()`, `getIVA()` (22%), `getTotal()`
- Carrello session-only (non persiste tra sessioni)
- Gli item configurati non permettono modifica quantità

### 6.7 Routing (App.jsx)

```
/login                    → LoginPage (pubblico)
/forgot-password          → ForgotPasswordPage (pubblico)
/reset-password           → ResetPasswordPage (pubblico)
/offline                  → OfflinePage (pubblico)

/ (Layout protetto)
  /admin/utenti           → UsersPage (tipo 1)
  /admin/import           → ImportPage (tipo 1)
  /listini                → PriceListsPage (tipo 2)
  /catalogo               → CatalogPage (tipo 3, 4)
  /configuratore          → ConfiguratorPage (tipo 3, 4)
  /carrello               → CartPage (tipo 3, 4)
  /preventivo             → QuoteFormPage (tipo 3, 4)
  /ordini                 → OrdersPage (tipo 3, 4)
```

Redirect automatico per `/` basato su tipo utente:
- Admin → `/admin/utenti`
- Super User → `/listini`
- Capo/Operatore → `/catalogo`

### 6.8 Componenti principali

#### Layout.jsx
Sidebar responsive con navigazione condizionale per tipo utente, selettore lingua, badge carrello, modali cambio password.

#### Configuratore 3D/2D

**FenceScene3D.jsx** — Visualizzazione Three.js:
- Componenti: `Palo` (palo con scanalature e cappellotto), `Doga` (doga con rotazione), `SezioneCompleta` (combinazione pali+doghe)
- Illuminazione: DirectionalLight con ombre, ambientLight
- Controlli: OrbitControls per rotazione/zoom
- Costanti geometriche: larghezza palo 6cm, altezza doga 2cm, gap persiana 1cm

**PlanView2D.jsx** — Vista planimetrica SVG:
- Click sull'ultimo palo per aggiungere sezione
- Drag per modificare lunghezza/angolo sezione
- Snap angoli a 0° o 90°
- Etichette dimensioni e indicatori angolo
- Barra scala di riferimento

#### Accessible3DCanvas.jsx
Wrapper per Canvas 3D con toggle alla vista testuale accessibile (AccessibleConfigurator).

#### AccessibleConfigurator.jsx
Alternativa testuale alla vista 3D: tabella sezioni, tabella BOM, parametri configurazione. Per screen reader.

#### ProductDetailModal.jsx
Modale dettaglio prodotto con immagine, prezzo, traduzioni, info tecniche, pulsanti azione.

#### EuritmoPreviewModal.jsx
Anteprima file EDI con colorazione tipi record, legenda, download e invio.

### 6.9 Pagine

#### CatalogPage.jsx (662 righe)
Catalogo prodotti con vista griglia/lista, ricerca per codice/descrizione, filtri categoria/famiglia/gruppo, ordinamento, paginazione, modale dettaglio, aggiunta al carrello.

#### ConfiguratorPage.jsx (735 righe)
Configuratore recinzioni a 3 step:
1. **Parametri:** colore doghe/pali, tipo montaggio, tipo doga, altezza pali
2. **Disegno:** piano 2D + vista 3D, gestione sezioni (aggiungi/rimuovi)
3. **Riepilogo:** distinta base calcolata con componenti, quantità, prezzi, totale

#### CartPage.jsx (269 righe)
Tabella carrello con righe espandibili per prodotti configurati, controlli quantità, ricalcolo totali.

#### QuoteFormPage.jsx (325 righe)
Form preventivo con dati fatturazione/consegna pre-compilati dall'anagrafica, pagamento, note, validazione.

#### OrdersPage.jsx (648 righe)
Gestione ordini con filtri stato, ricerca, dettaglio con righe gerarchiche, download PDF, conferma ordine, invio al fornitore con anteprima EURITMO.

#### PriceListsPage.jsx (607 righe)
Gestione listini per Super User: selezione punto vendita, vista listino pubblico, creazione/modifica listino personalizzato con confronto prezzi.

#### admin/UsersPage.jsx (241 righe)
CRUD utenti con validazione tipo utente, import/export Excel.

#### admin/ImportPage.jsx (526 righe)
Import massivo con tab per prodotti/prezzi/clienti/punti vendita, upload file, modalità merge/replace, conteggi dashboard.

---

## 7. Internazionalizzazione (i18n)

### Configurazione

```js
// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import it from './locales/it.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { it: { translation: it }, en: { translation: en }, fr: { translation: fr }, de: { translation: de } },
  fallbackLng: 'it',
  interpolation: { escapeValue: false },
});
```

### Struttura chiavi (tutte le lingue hanno la stessa struttura)

```
app.title, app.welcome
auth.login, auth.logout, auth.loginTitle
nav.catalog, nav.configurator, nav.cart, nav.quotes, nav.orders, ...
login.username, login.password, login.rememberMe, login.forgotPassword, ...
forgotPassword.title, forgotPassword.email, forgotPassword.send, ...
resetPassword.title, resetPassword.newPassword, ...
changePassword.title, changePassword.currentPassword, ...
users.title, users.create, users.edit, users.types.*, ...
import.title, import.tabs.*, import.upload.*, ...
priceLists.title, priceLists.createCustom, ...
catalog.title, catalog.search, catalog.filters.*, ...
configurator.title, configurator.steps.*, configurator.colors.*, ...
cart.title, cart.empty, cart.quantity, ...
quote.title, quote.billing.*, quote.delivery.*, ...
orders.title, orders.status.*, orders.actions.*, ...
euritmo.title, euritmo.preview, euritmo.records.*, ...
common.save, common.cancel, common.delete, common.loading, ...
a11y.skipToContent, a11y.skipToNav, a11y.mainContent, ...
pwa.offlineTitle, pwa.installTitle, pwa.updateAvailable, ...
```

### Verifica completezza

```bash
node tools/check-i18n.js          # Report sintetico
node tools/check-i18n.js --verbose # Include chiavi identiche all'italiano
```

### Formattazione locale (utils/formatters.js)

```js
// Mapping lingue → locali Intl
const localeMap = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };

// Formattatori disponibili:
formatNumber(value)     // 1.234,56 (IT) / 1,234.56 (EN)
formatCurrency(value)   // € 1.234,56
formatPercent(value)    // 22%
formatDate(value)       // 06/03/2026 (IT) / 06/03/2026 (EN)
formatDateTime(value)   // 06/03/2026 14:30
formatDateLong(value)   // 6 marzo 2026
formatQuantity(value)   // Senza decimali inutili
```

---

## 8. Accessibilità (WCAG 2.1 AA)

### Implementazioni

1. **Skip Links:** `<SkipLinks />` per saltare a contenuto principale e navigazione
2. **Focus Trap:** `useFocusTrap` hook per modali — Tab/Shift+Tab cicla tra elementi focusabili, Escape chiude
3. **ARIA attributes:** `aria-label`, `aria-hidden`, `aria-expanded`, `aria-invalid`, `aria-live`
4. **Tabelle:** `scope="col"` sugli header
5. **Icone decorative:** `aria-hidden="true"` su tutte le icone Lucide
6. **Contrasto colori:** primario-700+ per testo (minimo 4.5:1)
7. **Canvas 3D:** alternativa testuale via `Accessible3DCanvas` con toggle
8. **Reduced motion:** `@media (prefers-reduced-motion: reduce)` per transizioni
9. **High contrast:** `@media (forced-colors: active)` per testi con !important
10. **Print styles:** `@media print` per nascondere navigazione e mostrare solo contenuto

### CSS accessibilità (index.css)

```css
.sr-only { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); ... }

*:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

@media (forced-colors: active) {
  .btn-primary, .btn-success, .btn-danger { border: 2px solid ButtonText; }
}
```

---

## 9. Progressive Web App (PWA)

### 9.1 Configurazione (vite.config.js)

```js
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo-192.png', 'logo-512.png'],
  manifest: {
    name: 'Portale Recinzioni',
    short_name: 'Recinzioni',
    description: 'Configuratore recinzioni con preventivi e ordini',
    theme_color: '#2563eb',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'any',
    scope: '/',
    start_url: '/',
    lang: 'it',
    categories: ['business', 'productivity'],
    icons: [
      { src: 'logo-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'logo-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB (Three.js chunks)
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/swagger/],
    runtimeCaching: [
      // Prodotti e filtri — mostra cache poi aggiorna in background
      {
        urlPattern: /^https?:\/\/.*\/api\/prodotti/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'products-cache', expiration: { maxEntries: 100, maxAgeSeconds: 3600 } }
      },
      // Ordini e auth — dati critici, rete prima con fallback cache
      {
        urlPattern: /^https?:\/\/.*\/api\/(ordini|auth)/,
        handler: 'NetworkFirst',
        options: { cacheName: 'api-critical-cache', networkTimeoutSeconds: 5, expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
      },
      // Listini — cambiano poco
      {
        urlPattern: /^https?:\/\/.*\/api\/listini/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'pricelist-cache', expiration: { maxEntries: 50, maxAgeSeconds: 1800 } }
      },
      // Health check — sempre rete
      { urlPattern: /^https?:\/\/.*\/api\/health/, handler: 'NetworkOnly' },
      // Immagini statiche — cache first (30 giorni)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: { cacheName: 'images-cache', expiration: { maxEntries: 50, maxAgeSeconds: 2592000 } }
      },
      // Font — cache first (1 anno)
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
        handler: 'CacheFirst',
        options: { cacheName: 'fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } }
      }
    ]
  }
})
```

### 9.2 Registrazione Service Worker (main.jsx)

```jsx
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Notifica il componente UpdatePrompt che un aggiornamento è disponibile
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  onOfflineReady() {
    console.info('[PWA] App pronta per uso offline');
  },
  onRegisteredSW(swUrl, registration) {
    // Check aggiornamenti ogni 5 minuti
    if (registration) {
      setInterval(() => { registration.update(); }, 5 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Errore registrazione SW:', error);
  }
});

// Funzione di aggiornamento globale usata da UpdatePrompt
window.__PWA_UPDATE_SW = updateSW;
```

In aggiunta, il Layout.jsx esegue `registration.update()` ad ogni cambio pagina per rilevare nuove versioni tempestivamente.

### 9.3 Meta tags HTML (index.html)

```html
<meta name="theme-color" content="#2563eb" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Recinzioni" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 9.4 Asset PWA (public/)

| File | Dimensione | Scopo |
|------|-----------|-------|
| `favicon.ico` | 32x32 | Favicon browser |
| `favicon.svg` | Scalabile | Favicon SVG moderno |
| `apple-touch-icon.png` | 180x180 | Icona iOS home screen |
| `logo-192.png` | 192x192 | Icona PWA standard |
| `logo-512.png` | 512x512 | Icona PWA grande + maskable |

### 9.5 Componenti PWA

#### InstallPrompt.jsx
Banner di installazione che intercetta l'evento `beforeinstallprompt` del browser. Appare nella parte inferiore dello schermo con pulsanti "Installa" e "Non ora". Se l'utente clicca "Non ora", il banner non viene più mostrato per 7 giorni (gestito tramite `localStorage` con chiave `pwa-install-dismissed`). Si nasconde automaticamente dopo `appinstalled`.

#### UpdatePrompt.jsx
Banner di aggiornamento che ascolta l'evento custom `pwa-update-available` emesso da `main.jsx` quando il Service Worker rileva un nuovo build. Appare nella parte superiore dello schermo (ambra) con pulsanti "Aggiorna ora" e "Più tardi". Chiama `window.__PWA_UPDATE_SW(true)` per applicare l'aggiornamento, con fallback `window.location.reload()` dopo 500ms.

#### OfflineBanner.jsx
Banner rosso sottile che appare automaticamente quando la connessione cade (hook `useOnlineStatus` che monitora gli eventi `online`/`offline` del browser). Si nasconde quando la connessione ritorna.

#### OfflinePage.jsx
Pagina di fallback raggiungibile via route `/offline` quando l'utente tenta di accedere a una risorsa non disponibile in cache. Mostra icona WiFi spento, messaggio localizzato e pulsante "Riprova" che ricarica la pagina.

#### ChunkErrorBoundary (App.jsx)
Error Boundary React che intercetta errori di caricamento chunk JavaScript obsoleti (comuni dopo aggiornamenti PWA quando il Service Worker serve file vecchi). Rileva errori come `ChunkLoadError`, `Failed to fetch dynamically imported module`, etc. e forza un reload dalla rete con protezione anti-loop (max 1 reload ogni 10 secondi tramite `sessionStorage`).

### 9.6 Hook useOnlineStatus

```js
// hooks/useOnlineStatus.js
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { /* cleanup */ };
  }, []);
  return isOnline;
}
```

### 9.7 Strategie di Caching Workbox

| Cache | Strategia | Scadenza | Uso |
|-------|-----------|----------|-----|
| `products-cache` | StaleWhileRevalidate | 100 entries, 1 ora | `/api/prodotti` — mostra dati cache, aggiorna in background |
| `api-critical-cache` | NetworkFirst (timeout 5s) | 50 entries, 5 min | `/api/ordini`, `/api/auth` — priorità rete, fallback cache |
| `pricelist-cache` | StaleWhileRevalidate | 50 entries, 30 min | `/api/listini` — dati che cambiano poco |
| `images-cache` | CacheFirst | 50 entries, 30 giorni | Immagini statiche (PNG, JPG, SVG, WebP) |
| `fonts-cache` | CacheFirst | 10 entries, 1 anno | Web fonts (WOFF, WOFF2, TTF) |
| `/api/health` | NetworkOnly | — | Health check, sempre dalla rete |
| Precache (Workbox) | Precache | Automatico | JS, CSS, HTML, icone — generato dal build |

### 9.8 Traduzioni PWA (i18n)

Tutte le stringhe PWA sono localizzate in 4 lingue (12 chiavi per lingua):

| Chiave | IT | EN |
|--------|-----|-----|
| `pwa.installTitle` | Installa l'app | Install the app |
| `pwa.installMessage` | Installa il Portale Recinzioni... | Install the Fencing Portal... |
| `pwa.installButton` | Installa | Install |
| `pwa.dismissButton` | Non ora | Not now |
| `pwa.offlineTitle` | Sei offline | You are offline |
| `pwa.offlineMessage` | Controlla la connessione... | Check your Internet connection... |
| `pwa.offlineRetry` | Riprova | Retry |
| `pwa.offlineLimited` | Alcune funzionalità... | Some features... |
| `pwa.updateAvailable` | Aggiornamento disponibile | Update available |
| `pwa.updateMessage` | Una nuova versione... | A new version... |
| `pwa.updateButton` | Aggiorna ora | Update now |
| `pwa.updateDismiss` | Più tardi | Later |

Anche FR e DE hanno traduzioni complete.

---

## 10. EURITMO EDI — Generazione file ordini

### Formato

Standard GS1 Italy EURITMO ORDERS Release 25.1. File ASCII a record fissi (ogni record = una riga di lunghezza fissa in byte).

### Struttura file generato

```
BGM (168 bytes) — Testata: mittente, destinatario, tipo ORDERS, numero ordine, data
NAS (564 bytes) — Fornitore: P.IVA/codice, ragione sociale, indirizzo
CTA (153 bytes) — Contatto fornitore: telefono, email (opzionale)
NAB (305 bytes) — Buyer: P.IVA, ragione sociale, indirizzo fatturazione
NAD (305 bytes) — Punto consegna: indirizzo consegna
NAI (305 bytes) — Intestatario fattura: dati fatturazione
DTM (33 bytes)  — Data consegna richiesta (data ordine + 7 giorni)
FTX (216 bytes) — Note testata (opzionale)
PAT (198 bytes) — Termini pagamento (opzionale)
LIN (295 bytes) — Righe prodotto (solo righe padre, una per prodotto)
...
LIN (295 bytes) — Ultima riga prodotto
CNT (36 bytes)  — Sommario (conteggio righe)
```

### Conversione unità di misura

| Interno | EURITMO |
|---------|---------|
| PZ, CF | PCE |
| CM, MT, ML | MTR |
| KG | KGM |

### Flusso invio

1. `OrdiniController.InviaFornitore()` viene chiamato
2. `EuritmoService.GeneraFileOrdine()` genera il contenuto e salva su disco in `wwwroot/euritmo/`
3. `EmailService.InviaOrdineFornitore()` invia email con allegato .edi
4. Flag `FlagInvioFornitore` settato a `true` anche se email fallisce (file generato)

---

## 11. Deployment

### Sviluppo locale

```bash
# Backend
cd recinzioni-portal/backend/RecinzioniPortal.API
dotnet restore && dotnet run  # http://localhost:5000

# Frontend
cd recinzioni-portal/frontend
npm install && npm run dev    # http://localhost:5173, proxy /api → :5000

# Database
# Eseguire script SQL su SQL Server in ordine:
# 1. database/01_create_database.sql
# 2. database/02_auth_tables.sql
# 3. scripts/migration_add_prodotti_config.sql
# 4. scripts/migration_add_clienti_address.sql
# 5. scripts/migration_align_configurator_products.sql
```

### Produzione (Windows/IIS)

```powershell
# Script automatizzato
cd recinzioni-portal
.\scripts\deploy.ps1 -IISSitePath "C:\inetpub\wwwroot\recinzioni-portal"

# Step manuali:
# 1. Backup versione corrente
# 2. dotnet publish -c Release
# 3. npm run build
# 4. Copia frontend/dist → backend/publish/wwwroot
# 5. Stop IIS AppPool
# 6. Deploy file su IIS path
# 7. Start IIS AppPool
# 8. Health check: GET /api/health
```

### Produzione (Linux/Mac)

```bash
cd recinzioni-portal
bash scripts/deploy.sh
# Output: backend/RecinzioniPortal.API/publish/
```

---

## 12. Convenzioni e Regole di Codifica

### Backend (C#)
- Entity in file singoli condivisi: `Entities.cs`, `AuthEntities.cs`
- DTO in file singolo: `Dtos.cs` (record types)
- Controller sottili; logica nei servizi
- Commenti e naming di dominio in italiano, codice tecnico in inglese
- `[Authorize]` su controller, `[AllowAnonymous]` per endpoint pubblici
- Tipo utente verificato via JWT claims
- Nullable reference types abilitato

### Frontend (React/JSX)
- Componenti funzionali con hooks (no class components)
- PascalCase per componenti, camelCase per utility
- Tailwind CSS per styling, classi custom in index.css
- `useTranslation()` per tutti i testi utente — mai hardcodare
- `useFormatters()` per numeri/valute/date
- Toast notifications via `react-hot-toast`
- Form con controlled components + useState

### Database
- Naming italiano (tabelle e colonne)
- Chiavi composite dove appropriato
- `decimal(19,6)` per prezzi unitari, `decimal(19,2)` per totali
- IVA fissa 22%
- Script migration idempotenti (IF NOT EXISTS)

### Sicurezza
- Password: BCrypt cost 12
- JWT: HS256, scadenza 8 ore
- Refresh token: 30 giorni, revocabile
- Brute-force: 5 tentativi in 15 minuti
- Reset password: token 24 ore, URL-safe Base64
- Security headers IIS (X-Content-Type-Options, X-Frame-Options, etc.)
- HTML escaping in template email

---

## Appendice A — Utenti di default

| UserID | Login | Password | Tipo | ItemID | ItemIDSede |
|--------|-------|----------|------|--------|------------|
| 1 | admin | Admin123! | 1 (Admin) | NULL | NULL |
| 2 | superuser | Admin123! | 2 (Super User) | CLI001 | NULL |
| 3 | caponegozio | Admin123! | 3 (Manager) | CLI001 | SEDE01 |
| 4 | operatore | Admin123! | 4 (Operatore) | CLI001 | SEDE01 |

## Appendice B — Comandi rapidi

| Task | Comando | Directory |
|------|---------|-----------|
| Backend dev | `dotnet run` | `backend/RecinzioniPortal.API` |
| Frontend dev | `npm run dev` | `frontend` |
| Frontend build | `npm run build` | `frontend` |
| Backend publish | `dotnet publish -c Release` | `backend/RecinzioniPortal.API` |
| Verifica i18n | `node tools/check-i18n.js` | `recinzioni-portal` |
| Deploy Linux | `bash scripts/deploy.sh` | `recinzioni-portal` |
| Deploy Windows | `.\scripts\deploy.ps1` | `recinzioni-portal` |

---

*Fine della documentazione tecnica.*
