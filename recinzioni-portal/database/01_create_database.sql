-- ============================================================
-- RECINZIONI PORTAL - Database Creation Script
-- Version: 1.0 (based on Analisi Funzionale v1.5)
-- ============================================================

-- 1. Create Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'RecinzioniPortal')
BEGIN
    CREATE DATABASE [RecinzioniPortal]
    COLLATE Latin1_General_CI_AS;
END
GO

USE [RecinzioniPortal]
GO

-- ============================================================
-- 2. TABELLE ANAGRAFICHE
-- ============================================================

-- Clienti
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clienti')
CREATE TABLE [dbo].[Clienti](
    [ItemID]      [varchar](16)   NOT NULL,
    [ItemDes]     [nvarchar](256) NULL,
    [PIva]        [varchar](16)   NULL,
    [CFis]        [varchar](16)   NULL,
    [LstCod]      [varchar](32)   NULL,
    [LstCodPubb]  [varchar](32)   NULL,
    [PagCod]      [varchar](16)   NULL,
    CONSTRAINT [PK_Clienti] PRIMARY KEY ([ItemID])
)
GO

-- Punti di Vendita
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PuntiDiVendita')
CREATE TABLE [dbo].[PuntiDiVendita](
    [ItemID]      [varchar](16)   NOT NULL,
    [ItemIDSede]  [varchar](16)   NOT NULL,
    [ItemDes]     [nvarchar](256) NULL,
    [Ind]         [nvarchar](256) NULL,
    [Cap]         [varchar](16)   NULL,
    [Loc]         [nvarchar](128) NULL,
    [Pro]         [varchar](16)   NULL,
    [Reg]         [varchar](32)   NULL,
    [Naz]         [varchar](64)   NULL,
    [LstCod]      [varchar](32)   NULL,
    [LstCodPubb]  [varchar](32)   NULL,
    [PagCod]      [varchar](16)   NULL,
    [Tel]         [varchar](32)   NULL,
    [Mail]        [varchar](64)   NULL,
    CONSTRAINT [PK_PuntiVendita] PRIMARY KEY ([ItemID],[ItemIDSede]),
    CONSTRAINT [FK_PuntiVendita_Clienti] FOREIGN KEY ([ItemID]) REFERENCES [Clienti]([ItemID])
)
GO

-- Utenti
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Utenti')
CREATE TABLE [dbo].[Utenti](
    [UserID]      [smallint]      NOT NULL,
    [UserLogin]   [varchar](32)   NULL,
    [Password]    [varchar](128)  NULL,
    [UserName]    [varchar](64)   NULL,
    [UserType]    [tinyint]       NULL,
    [MailAddress] [varchar](64)   NULL,
    [ItemID]      [varchar](16)   NULL,
    [ItemIDSede]  [varchar](16)   NULL,
    CONSTRAINT [PK_Utenti] PRIMARY KEY ([UserID])
)
GO

-- Prodotti
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Prodotti')
CREATE TABLE [dbo].[Prodotti](
    [PrdCod]   [varchar](32)   NOT NULL,
    [PrdDes]   [nvarchar](256) NULL,
    [PrdUm]    [varchar](8)    NULL,
    [PosArc]   [varchar](32)   NULL,
    [PrvCla]   [varchar](8)    NULL,
    [SitCod]   [varchar](32)   NULL,
    [GrpCod]   [varchar](32)   NULL,
    [CatCod]   [varchar](32)   NULL,
    [TreeCod]  [varchar](16)   NULL,
    [FamCod]   [varchar](32)   NULL,
    [DiBaCod]  [varchar](32)   NULL,
    CONSTRAINT [PK_Prodotti] PRIMARY KEY ([PrdCod])
)
GO

-- Traduzioni Prodotti
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProdottiTrad')
CREATE TABLE [dbo].[ProdottiTrad](
    [PrdCod]    [varchar](32)   NOT NULL,
    [LangCode]  [varchar](5)    NOT NULL,
    [PrdDes]    [nvarchar](256) NULL,
    CONSTRAINT [PK_ProdottiTrad] PRIMARY KEY ([PrdCod],[LangCode]),
    CONSTRAINT [FK_ProdottiTrad] FOREIGN KEY ([PrdCod]) REFERENCES [Prodotti]([PrdCod]) ON DELETE CASCADE
)
GO

-- Prezzi
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Prezzi')
CREATE TABLE [dbo].[Prezzi](
    [PrdCod]  [varchar](32)    NOT NULL,
    [LstCod]  [varchar](32)    NOT NULL,
    [PrdPrz]  [decimal](19,6)  NULL,
    CONSTRAINT [PK_Prezzi] PRIMARY KEY ([PrdCod],[LstCod]),
    CONSTRAINT [FK_Prezzi_Prodotti] FOREIGN KEY ([PrdCod]) REFERENCES [Prodotti]([PrdCod])
)
GO

-- Testata Listini
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LstTst')
CREATE TABLE [dbo].[LstTst](
    [LstCod]    [varchar](32) NOT NULL,
    [ValidoDal] [date]        NOT NULL,
    [ValidoAl]  [date]        NOT NULL,
    CONSTRAINT [PK_LstTst] PRIMARY KEY ([LstCod],[ValidoDal],[ValidoAl])
)
GO

-- ============================================================
-- 3. TABELLE ORDINI / PREVENTIVI
-- ============================================================

-- Testata Ordini/Preventivi
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrdPrevTst')
CREATE TABLE [dbo].[OrdPrevTst](
    [OrdNum]           [int] IDENTITY(1,1) NOT NULL,
    [OrdData]          [datetime]       NOT NULL DEFAULT GETDATE(),
    [Stato]            [varchar](16)    NOT NULL DEFAULT 'Carrello', -- Carrello/Preventivo/Ordine
    [UserID]           [smallint]       NULL,
    [ItemID]           [varchar](16)    NULL,
    [ItemIDSede]       [varchar](16)    NULL,
    -- Dati fatturazione
    [FattRagSoc]       [nvarchar](256)  NULL,
    [FattIndirizzo]    [nvarchar](256)  NULL,
    [FattCap]          [varchar](16)    NULL,
    [FattCitta]        [nvarchar](128)  NULL,
    [FattProvincia]    [varchar](16)    NULL,
    [FattPIva]         [varchar](16)    NULL,
    [FattCFis]         [varchar](16)    NULL,
    -- Dati consegna
    [ConsRagSoc]       [nvarchar](256)  NULL,
    [ConsIndirizzo]    [nvarchar](256)  NULL,
    [ConsCap]          [varchar](16)    NULL,
    [ConsCitta]        [nvarchar](128)  NULL,
    [ConsProvincia]    [varchar](16)    NULL,
    -- Pagamento e totali
    [PagCod]           [varchar](16)    NULL,
    [PagDescrizione]   [nvarchar](128)  NULL,
    [Subtotale]        [decimal](19,2)  NULL DEFAULT 0,
    [AliquotaIVA]      [decimal](5,2)   NULL DEFAULT 22.00,
    [ImportoIVA]       [decimal](19,2)  NULL DEFAULT 0,
    [Totale]           [decimal](19,2)  NULL DEFAULT 0,
    [Note]             [nvarchar](1000) NULL,
    -- Flag
    [FlagConferma]     [bit]            NOT NULL DEFAULT 0,
    [FlagInvioFornitore] [bit]          NOT NULL DEFAULT 0,
    [DataInvioFornitore] [datetime]     NULL,
    CONSTRAINT [PK_OrdPrevTst] PRIMARY KEY ([OrdNum])
)
GO

-- Dettaglio righe ordini/preventivi
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrdPrevDett')
CREATE TABLE [dbo].[OrdPrevDett](
    [OrdNum]       [int]            NOT NULL,
    [RigaNum]      [int]            NOT NULL,
    [RigaPadre]    [int]            NULL,       -- NULL per prodotti semplici, ref riga padre per componenti
    [PrdCod]       [varchar](32)    NULL,
    [PrdDes]       [nvarchar](256)  NULL,
    [PrdUm]        [varchar](8)     NULL,
    [Quantita]     [decimal](19,3)  NULL,
    [PrezzoUnitario] [decimal](19,6) NULL,
    [PrezzoTotale]   [decimal](19,2) NULL,
    CONSTRAINT [PK_OrdPrevDett] PRIMARY KEY ([OrdNum],[RigaNum]),
    CONSTRAINT [FK_OrdPrevDett_Tst] FOREIGN KEY ([OrdNum]) REFERENCES [OrdPrevTst]([OrdNum]) ON DELETE CASCADE
)
GO

-- Configurazione recinzione (parametri generali)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrdPrevConfig')
CREATE TABLE [dbo].[OrdPrevConfig](
    [OrdNum]         [int]          NOT NULL,
    [RigaNum]        [int]          NOT NULL,
    [ColoreDoghe]    [varchar](16)  NULL,
    [ColorePali]     [varchar](16)  NULL,
    [StessoColore]   [bit]          NULL DEFAULT 1,
    [Fissaggio]      [varchar](16)  NULL,  -- cemento / terreno
    [TipoDoghe]      [varchar](16)  NULL,  -- persiana / pieno
    [AltezzaPali]    [int]          NULL,  -- 100, 150, 185, 200
    [NumeroDoghe]    [int]          NULL,
    [NumeroSezioni]  [int]          NULL,
    [SezioniJson]    [nvarchar](max) NULL,  -- JSON con dettaglio sezioni [{lunghezza, angolo}]
    CONSTRAINT [PK_OrdPrevConfig] PRIMARY KEY ([OrdNum],[RigaNum]),
    CONSTRAINT [FK_OrdPrevConfig_Dett] FOREIGN KEY ([OrdNum],[RigaNum]) REFERENCES [OrdPrevDett]([OrdNum],[RigaNum]) ON DELETE CASCADE
)
GO

-- ============================================================
-- 4. TABELLA NOTIFICHE EMAIL
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificheConfig')
CREATE TABLE [dbo].[NotificheConfig](
    [NotificaID]   [int] IDENTITY(1,1) NOT NULL,
    [Tipo]         [varchar](32)   NOT NULL, -- RecuperoPassword, InvioOrdine
    [Template]     [nvarchar](max) NULL,
    [Oggetto]      [nvarchar](256) NULL,
    [Attiva]       [bit]           NOT NULL DEFAULT 1,
    CONSTRAINT [PK_NotificheConfig] PRIMARY KEY ([NotificaID])
)
GO

-- ============================================================
-- 5. TABELLA REFRESH TOKEN (per JWT)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
CREATE TABLE [dbo].[RefreshTokens](
    [TokenID]      [int] IDENTITY(1,1) NOT NULL,
    [UserID]       [smallint]      NOT NULL,
    [Token]        [varchar](256)  NOT NULL,
    [Expires]      [datetime]      NOT NULL,
    [Created]      [datetime]      NOT NULL DEFAULT GETDATE(),
    [Revoked]      [datetime]      NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([TokenID]),
    CONSTRAINT [FK_RefreshTokens_Utenti] FOREIGN KEY ([UserID]) REFERENCES [Utenti]([UserID]) ON DELETE CASCADE
)
GO

-- ============================================================
-- 6. DATI INIZIALI
-- ============================================================

-- Admin di default (password: Admin123!)
-- Hash BCrypt di 'Admin123!' generato con work factor 12
IF NOT EXISTS (SELECT * FROM [Utenti] WHERE [UserID] = 1)
INSERT INTO [Utenti] ([UserID],[UserLogin],[Password],[UserName],[UserType],[MailAddress])
VALUES (1, 'admin', '$2a$12$LJ3m4ys3GZvnOV1XFOqKGOzKkr1oPHVRJfOLXaOGm.qMFfsAMjW6e', 'Amministratore', 1, 'admin@example.com')
GO

-- Template notifiche
IF NOT EXISTS (SELECT * FROM [NotificheConfig] WHERE [Tipo] = 'RecuperoPassword')
INSERT INTO [NotificheConfig] ([Tipo],[Template],[Oggetto])
VALUES ('RecuperoPassword', N'<h2>Recupero Password</h2><p>Ciao {{UserName}},</p><p>Clicca sul seguente link per reimpostare la tua password:</p><p><a href="{{ResetLink}}">Reimposta Password</a></p><p>Il link scadrà tra 24 ore.</p>', N'Recupero Password - Portale Recinzioni')
GO

IF NOT EXISTS (SELECT * FROM [NotificheConfig] WHERE [Tipo] = 'InvioOrdine')
INSERT INTO [NotificheConfig] ([Tipo],[Template],[Oggetto])
VALUES ('InvioOrdine', N'<h2>Ordine {{NumeroOrdine}}</h2><p>In allegato il file EURITMO ORDERS relativo all''ordine N. {{NumeroOrdine}} del {{DataOrdine}}.</p><p>Emittente: {{RagioneSociale}}</p>', N'Ordine EURITMO N. {{NumeroOrdine}}')
GO

-- ============================================================
-- 7. DATI DI ESEMPIO (per test)
-- ============================================================

-- Cliente di esempio
IF NOT EXISTS (SELECT * FROM [Clienti] WHERE [ItemID] = 'CLI001')
INSERT INTO [Clienti] ([ItemID],[ItemDes],[PIva],[CFis],[LstCod],[LstCodPubb],[PagCod])
VALUES ('CLI001', N'Recinzioni Italia S.r.l.', '12345678901', 'ABCDEF12G34H567I', 'LST001', 'LSTPUB001', 'PAG30')
GO

-- Punto di vendita di esempio
IF NOT EXISTS (SELECT * FROM [PuntiDiVendita] WHERE [ItemID] = 'CLI001' AND [ItemIDSede] = 'SEDE01')
INSERT INTO [PuntiDiVendita] ([ItemID],[ItemIDSede],[ItemDes],[Ind],[Cap],[Loc],[Pro],[Reg],[Naz],[LstCod],[LstCodPubb],[PagCod],[Tel],[Mail])
VALUES ('CLI001','SEDE01',N'Showroom Torino',N'Via Roma 100','10121',N'Torino','TO',N'Piemonte','IT','LST001','LSTPUB001','PAG30','011-1234567','torino@recinzioniitalia.it')
GO

-- Utenti di esempio
IF NOT EXISTS (SELECT * FROM [Utenti] WHERE [UserID] = 2)
INSERT INTO [Utenti] ([UserID],[UserLogin],[Password],[UserName],[UserType],[MailAddress],[ItemID])
VALUES (2, 'superuser', '$2a$12$LJ3m4ys3GZvnOV1XFOqKGOzKkr1oPHVRJfOLXaOGm.qMFfsAMjW6e', 'Super User Demo', 2, 'super@example.com', 'CLI001')
GO

IF NOT EXISTS (SELECT * FROM [Utenti] WHERE [UserID] = 3)
INSERT INTO [Utenti] ([UserID],[UserLogin],[Password],[UserName],[UserType],[MailAddress],[ItemID],[ItemIDSede])
VALUES (3, 'caponegozio', '$2a$12$LJ3m4ys3GZvnOV1XFOqKGOzKkr1oPHVRJfOLXaOGm.qMFfsAMjW6e', 'Capo Negozio Demo', 3, 'capo@example.com', 'CLI001', 'SEDE01')
GO

IF NOT EXISTS (SELECT * FROM [Utenti] WHERE [UserID] = 4)
INSERT INTO [Utenti] ([UserID],[UserLogin],[Password],[UserName],[UserType],[MailAddress],[ItemID],[ItemIDSede])
VALUES (4, 'operatore', '$2a$12$LJ3m4ys3GZvnOV1XFOqKGOzKkr1oPHVRJfOLXaOGm.qMFfsAMjW6e', 'Operatore Demo', 4, 'operatore@example.com', 'CLI001', 'SEDE01')
GO

-- Prodotti di esempio (componenti recinzione)
-- Codici allineati a quelli generati dal ConfiguratoreService:
--   Pali:         PAL-{altezza}-{colore}   (es. PAL-150-GR)
--   Doghe:        DOG-150-{colore}
--   Fissaggi:     FIX-CEM-01, FIX-TER-01
--   Distanziali:  DST-PER-01, DST-PIE-01
--   Cappellotti:  ACC-CAP-{colore}
--   Angolari:     ACC-ANG-90
--   Configurato:  CONF-REC
IF NOT EXISTS (SELECT * FROM [Prodotti] WHERE [PrdCod] = 'PAL-100-GR')
BEGIN
    -- Pali (4 altezze x 3 colori = 12)
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-100-GR', N'Palo montante H100 cm - Grigio', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-100-VE', N'Palo montante H100 cm - Verde', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-100-RO', N'Palo montante H100 cm - Rosso mattone', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-150-GR', N'Palo montante H150 cm - Grigio', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-150-VE', N'Palo montante H150 cm - Verde', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-150-RO', N'Palo montante H150 cm - Rosso mattone', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-185-GR', N'Palo montante H185 cm - Grigio', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-185-VE', N'Palo montante H185 cm - Verde', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-185-RO', N'Palo montante H185 cm - Rosso mattone', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-200-GR', N'Palo montante H200 cm - Grigio', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-200-VE', N'Palo montante H200 cm - Verde', 'PZ', 'PALI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('PAL-200-RO', N'Palo montante H200 cm - Rosso mattone', 'PZ', 'PALI', 'RECINZIONI')
    -- Doghe (3 colori)
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('DOG-150-GR', N'Doga orizzontale L150 cm - Grigio', 'PZ', 'DOGHE', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('DOG-150-VE', N'Doga orizzontale L150 cm - Verde', 'PZ', 'DOGHE', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('DOG-150-RO', N'Doga orizzontale L150 cm - Rosso mattone', 'PZ', 'DOGHE', 'RECINZIONI')
    -- Fissaggi
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('FIX-CEM-01', N'Kit fissaggio su cemento', 'PZ', 'FISSAGGI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('FIX-TER-01', N'Kit fissaggio su terreno', 'PZ', 'FISSAGGI', 'RECINZIONI')
    -- Distanziali
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('DST-PER-01', N'Distanziale per persiana', 'PZ', 'ACCESSORI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('DST-PIE-01', N'Distanziale per pieno', 'PZ', 'ACCESSORI', 'RECINZIONI')
    -- Cappellotti (3 colori)
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('ACC-CAP-GR', N'Cappellotto palo - Grigio', 'PZ', 'ACCESSORI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('ACC-CAP-VE', N'Cappellotto palo - Verde', 'PZ', 'ACCESSORI', 'RECINZIONI')
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('ACC-CAP-RO', N'Cappellotto palo - Rosso mattone', 'PZ', 'ACCESSORI', 'RECINZIONI')
    -- Angolare
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('ACC-ANG-90', N'Giunzione angolare 90°', 'PZ', 'ACCESSORI', 'RECINZIONI')
    -- Configurato (prodotto padre)
    INSERT INTO [Prodotti] ([PrdCod],[PrdDes],[PrdUm],[CatCod],[FamCod]) VALUES ('CONF-REC',   N'Recinzione configurata', 'PZ', 'CONFIGURATI', 'RECINZIONI')
END
GO

-- Traduzioni prodotti
IF NOT EXISTS (SELECT * FROM [ProdottiTrad] WHERE [PrdCod] = 'PAL-100-GR')
BEGIN
    INSERT INTO [ProdottiTrad] VALUES ('PAL-100-GR','en',N'Post H100 cm - Grey')
    INSERT INTO [ProdottiTrad] VALUES ('PAL-100-GR','fr',N'Poteau H100 cm - Gris')
    INSERT INTO [ProdottiTrad] VALUES ('PAL-100-GR','de',N'Pfosten H100 cm - Grau')
    INSERT INTO [ProdottiTrad] VALUES ('DOG-150-GR','en',N'Horizontal slat L150 cm - Grey')
    INSERT INTO [ProdottiTrad] VALUES ('DOG-150-GR','fr',N'Lame horizontale L150 cm - Gris')
    INSERT INTO [ProdottiTrad] VALUES ('DOG-150-GR','de',N'Horizontalleiste L150 cm - Grau')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-CEM-01','en',N'Concrete fixing kit')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-CEM-01','fr',N'Kit fixation béton')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-CEM-01','de',N'Befestigungsset Beton')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-TER-01','en',N'Ground fixing kit')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-TER-01','fr',N'Kit fixation sol')
    INSERT INTO [ProdottiTrad] VALUES ('FIX-TER-01','de',N'Befestigungsset Boden')
    INSERT INTO [ProdottiTrad] VALUES ('ACC-ANG-90','en',N'90° angular joint')
    INSERT INTO [ProdottiTrad] VALUES ('ACC-ANG-90','fr',N'Jonction angulaire 90°')
    INSERT INTO [ProdottiTrad] VALUES ('ACC-ANG-90','de',N'90°-Winkelverbinder')
END
GO

-- Prezzi di esempio (listino pubblico)
IF NOT EXISTS (SELECT * FROM [Prezzi] WHERE [PrdCod] = 'PAL-100-GR' AND [LstCod] = 'LSTPUB001')
BEGIN
    -- Pali
    INSERT INTO [Prezzi] VALUES ('PAL-100-GR','LSTPUB001', 25.00)
    INSERT INTO [Prezzi] VALUES ('PAL-100-VE','LSTPUB001', 27.00)
    INSERT INTO [Prezzi] VALUES ('PAL-100-RO','LSTPUB001', 27.00)
    INSERT INTO [Prezzi] VALUES ('PAL-150-GR','LSTPUB001', 35.00)
    INSERT INTO [Prezzi] VALUES ('PAL-150-VE','LSTPUB001', 37.50)
    INSERT INTO [Prezzi] VALUES ('PAL-150-RO','LSTPUB001', 37.50)
    INSERT INTO [Prezzi] VALUES ('PAL-185-GR','LSTPUB001', 45.00)
    INSERT INTO [Prezzi] VALUES ('PAL-185-VE','LSTPUB001', 48.00)
    INSERT INTO [Prezzi] VALUES ('PAL-185-RO','LSTPUB001', 48.00)
    INSERT INTO [Prezzi] VALUES ('PAL-200-GR','LSTPUB001', 50.00)
    INSERT INTO [Prezzi] VALUES ('PAL-200-VE','LSTPUB001', 53.00)
    INSERT INTO [Prezzi] VALUES ('PAL-200-RO','LSTPUB001', 53.00)
    -- Doghe
    INSERT INTO [Prezzi] VALUES ('DOG-150-GR','LSTPUB001', 12.50)
    INSERT INTO [Prezzi] VALUES ('DOG-150-VE','LSTPUB001', 13.50)
    INSERT INTO [Prezzi] VALUES ('DOG-150-RO','LSTPUB001', 13.50)
    -- Fissaggi
    INSERT INTO [Prezzi] VALUES ('FIX-CEM-01','LSTPUB001', 8.00)
    INSERT INTO [Prezzi] VALUES ('FIX-TER-01','LSTPUB001', 10.00)
    -- Distanziali
    INSERT INTO [Prezzi] VALUES ('DST-PER-01','LSTPUB001', 1.50)
    INSERT INTO [Prezzi] VALUES ('DST-PIE-01','LSTPUB001', 1.20)
    -- Cappellotti
    INSERT INTO [Prezzi] VALUES ('ACC-CAP-GR','LSTPUB001', 3.50)
    INSERT INTO [Prezzi] VALUES ('ACC-CAP-VE','LSTPUB001', 4.00)
    INSERT INTO [Prezzi] VALUES ('ACC-CAP-RO','LSTPUB001', 4.00)
    -- Angolare
    INSERT INTO [Prezzi] VALUES ('ACC-ANG-90','LSTPUB001', 6.50)
END
GO

-- Testata listino
IF NOT EXISTS (SELECT * FROM [LstTst] WHERE [LstCod] = 'LSTPUB001')
INSERT INTO [LstTst] VALUES ('LSTPUB001', '2026-01-01', '2026-12-31')
GO

PRINT '========================================'
PRINT 'Database RecinzioniPortal creato con successo!'
PRINT '========================================'
GO
