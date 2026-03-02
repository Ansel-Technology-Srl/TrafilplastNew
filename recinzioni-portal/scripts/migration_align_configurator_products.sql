-- ============================================================
-- Migration: Align configurator products with BOM engine
-- Date: 2026-03-02
-- Description:
--   1. Sets DiBaCod and CfgColore on existing fence products
--      so ConfiguratoreService.RisolviProdottoBom can find them
--   2. Adds new products for updated color palette:
--      BI (Bianco melange), MA (Marrone), AN (Antracite)
--   3. Adds missing COV-* (cover) products
--   4. Adds prices for all new products
-- ============================================================

-- ─── 1. Ensure CfgTipo and CfgColore columns exist ─────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Prodotti') AND name = 'CfgTipo')
BEGIN
    ALTER TABLE Prodotti ADD CfgTipo NVARCHAR(32) NULL;
    PRINT 'Added column CfgTipo to Prodotti';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Prodotti') AND name = 'CfgColore')
BEGIN
    ALTER TABLE Prodotti ADD CfgColore NVARCHAR(16) NULL;
    PRINT 'Added column CfgColore to Prodotti';
END
GO

-- ─── 2. Set DiBaCod and CfgColore on existing products ─────

-- Pali (existing GR/VE/RO)
UPDATE Prodotti SET DiBaCod = 'PAL-100', CfgColore = 'GR' WHERE PrdCod = 'PAL-100-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-100', CfgColore = 'VE' WHERE PrdCod = 'PAL-100-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-100', CfgColore = 'RO' WHERE PrdCod = 'PAL-100-RO' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-150', CfgColore = 'GR' WHERE PrdCod = 'PAL-150-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-150', CfgColore = 'VE' WHERE PrdCod = 'PAL-150-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-150', CfgColore = 'RO' WHERE PrdCod = 'PAL-150-RO' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-185', CfgColore = 'GR' WHERE PrdCod = 'PAL-185-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-185', CfgColore = 'VE' WHERE PrdCod = 'PAL-185-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-185', CfgColore = 'RO' WHERE PrdCod = 'PAL-185-RO' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-200', CfgColore = 'GR' WHERE PrdCod = 'PAL-200-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-200', CfgColore = 'VE' WHERE PrdCod = 'PAL-200-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'PAL-200', CfgColore = 'RO' WHERE PrdCod = 'PAL-200-RO' AND (DiBaCod IS NULL OR DiBaCod = '');

-- Doghe (existing GR/VE/RO)
UPDATE Prodotti SET DiBaCod = 'DOG-150', CfgColore = 'GR' WHERE PrdCod = 'DOG-150-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'DOG-150', CfgColore = 'VE' WHERE PrdCod = 'DOG-150-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'DOG-150', CfgColore = 'RO' WHERE PrdCod = 'DOG-150-RO' AND (DiBaCod IS NULL OR DiBaCod = '');

-- Fissaggi (nessun colore)
UPDATE Prodotti SET DiBaCod = 'FIX-CEM' WHERE PrdCod = 'FIX-CEM-01' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'FIX-TER' WHERE PrdCod = 'FIX-TER-01' AND (DiBaCod IS NULL OR DiBaCod = '');

-- Distanziali (nessun colore)
UPDATE Prodotti SET DiBaCod = 'DST-PER' WHERE PrdCod = 'DST-PER-01' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'DST-PIE' WHERE PrdCod = 'DST-PIE-01' AND (DiBaCod IS NULL OR DiBaCod = '');

-- Cappellotti (existing GR/VE/RO)
UPDATE Prodotti SET DiBaCod = 'ACC-CAP', CfgColore = 'GR' WHERE PrdCod = 'ACC-CAP-GR' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'ACC-CAP', CfgColore = 'VE' WHERE PrdCod = 'ACC-CAP-VE' AND (DiBaCod IS NULL OR DiBaCod = '');
UPDATE Prodotti SET DiBaCod = 'ACC-CAP', CfgColore = 'RO' WHERE PrdCod = 'ACC-CAP-RO' AND (DiBaCod IS NULL OR DiBaCod = '');

-- Angolare (nessun colore)
UPDATE Prodotti SET DiBaCod = 'ACC-ANG' WHERE PrdCod = 'ACC-ANG-90' AND (DiBaCod IS NULL OR DiBaCod = '');

PRINT 'DiBaCod/CfgColore set on existing products.';
GO

-- ─── 3. Add new products for BI/MA/AN color palette ─────────

-- Pali BI (Bianco melange)
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-100-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-100-BI', N'Palo montante H100 cm - Bianco melange', 'PZ', 'PALI', 'RECINZIONI', 'PAL-100', 'BI');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-150-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-150-BI', N'Palo montante H150 cm - Bianco melange', 'PZ', 'PALI', 'RECINZIONI', 'PAL-150', 'BI');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-185-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-185-BI', N'Palo montante H185 cm - Bianco melange', 'PZ', 'PALI', 'RECINZIONI', 'PAL-185', 'BI');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-200-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-200-BI', N'Palo montante H200 cm - Bianco melange', 'PZ', 'PALI', 'RECINZIONI', 'PAL-200', 'BI');

-- Pali MA (Marrone)
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-100-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-100-MA', N'Palo montante H100 cm - Marrone', 'PZ', 'PALI', 'RECINZIONI', 'PAL-100', 'MA');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-150-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-150-MA', N'Palo montante H150 cm - Marrone', 'PZ', 'PALI', 'RECINZIONI', 'PAL-150', 'MA');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-185-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-185-MA', N'Palo montante H185 cm - Marrone', 'PZ', 'PALI', 'RECINZIONI', 'PAL-185', 'MA');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-200-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-200-MA', N'Palo montante H200 cm - Marrone', 'PZ', 'PALI', 'RECINZIONI', 'PAL-200', 'MA');

-- Pali AN (Antracite)
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-100-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-100-AN', N'Palo montante H100 cm - Antracite', 'PZ', 'PALI', 'RECINZIONI', 'PAL-100', 'AN');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-150-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-150-AN', N'Palo montante H150 cm - Antracite', 'PZ', 'PALI', 'RECINZIONI', 'PAL-150', 'AN');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-185-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-185-AN', N'Palo montante H185 cm - Antracite', 'PZ', 'PALI', 'RECINZIONI', 'PAL-185', 'AN');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'PAL-200-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('PAL-200-AN', N'Palo montante H200 cm - Antracite', 'PZ', 'PALI', 'RECINZIONI', 'PAL-200', 'AN');

-- Doghe BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'DOG-150-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('DOG-150-BI', N'Doga orizzontale L150 cm - Bianco melange', 'PZ', 'DOGHE', 'RECINZIONI', 'DOG-150', 'BI');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'DOG-150-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('DOG-150-MA', N'Doga orizzontale L150 cm - Marrone', 'PZ', 'DOGHE', 'RECINZIONI', 'DOG-150', 'MA');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'DOG-150-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('DOG-150-AN', N'Doga orizzontale L150 cm - Antracite', 'PZ', 'DOGHE', 'RECINZIONI', 'DOG-150', 'AN');

-- Cappellotti BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'ACC-CAP-BI')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('ACC-CAP-BI', N'Cappellotto palo - Bianco melange', 'PZ', 'ACCESSORI', 'RECINZIONI', 'ACC-CAP', 'BI');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'ACC-CAP-MA')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('ACC-CAP-MA', N'Cappellotto palo - Marrone', 'PZ', 'ACCESSORI', 'RECINZIONI', 'ACC-CAP', 'MA');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'ACC-CAP-AN')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod, CfgColore) VALUES ('ACC-CAP-AN', N'Cappellotto palo - Antracite', 'PZ', 'ACCESSORI', 'RECINZIONI', 'ACC-CAP', 'AN');

-- Cover (COV-*) — coperchi scanalatura palo, nessun colore
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'COV-100-01')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod) VALUES ('COV-100-01', N'Cover scanalatura palo H100 cm', 'PZ', 'ACCESSORI', 'RECINZIONI', 'COV-100');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'COV-150-01')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod) VALUES ('COV-150-01', N'Cover scanalatura palo H150 cm', 'PZ', 'ACCESSORI', 'RECINZIONI', 'COV-150');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'COV-185-01')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod) VALUES ('COV-185-01', N'Cover scanalatura palo H185 cm', 'PZ', 'ACCESSORI', 'RECINZIONI', 'COV-185');
IF NOT EXISTS (SELECT 1 FROM Prodotti WHERE PrdCod = 'COV-200-01')
    INSERT INTO Prodotti (PrdCod, PrdDes, PrdUm, CatCod, FamCod, DiBaCod) VALUES ('COV-200-01', N'Cover scanalatura palo H200 cm', 'PZ', 'ACCESSORI', 'RECINZIONI', 'COV-200');

PRINT 'New products (BI/MA/AN + COV) inserted.';
GO

-- ─── 4. Add translations for new products ───────────────────

-- Pali BI
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'PAL-100-BI' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('PAL-100-BI','en',N'Post H100 cm - White melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-BI','fr',N'Poteau H100 cm - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-BI','de',N'Pfosten H100 cm - Weiß melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-BI','en',N'Post H150 cm - White melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-BI','fr',N'Poteau H150 cm - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-BI','de',N'Pfosten H150 cm - Weiß melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-BI','en',N'Post H185 cm - White melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-BI','fr',N'Poteau H185 cm - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-BI','de',N'Pfosten H185 cm - Weiß melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-BI','en',N'Post H200 cm - White melange')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-BI','fr',N'Poteau H200 cm - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-BI','de',N'Pfosten H200 cm - Weiß melange')
END
GO

-- Pali MA
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'PAL-100-MA' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('PAL-100-MA','en',N'Post H100 cm - Brown')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-MA','fr',N'Poteau H100 cm - Marron')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-MA','de',N'Pfosten H100 cm - Braun')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-MA','en',N'Post H150 cm - Brown')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-MA','fr',N'Poteau H150 cm - Marron')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-MA','de',N'Pfosten H150 cm - Braun')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-MA','en',N'Post H185 cm - Brown')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-MA','fr',N'Poteau H185 cm - Marron')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-MA','de',N'Pfosten H185 cm - Braun')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-MA','en',N'Post H200 cm - Brown')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-MA','fr',N'Poteau H200 cm - Marron')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-MA','de',N'Pfosten H200 cm - Braun')
END
GO

-- Pali AN
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'PAL-100-AN' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('PAL-100-AN','en',N'Post H100 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-AN','fr',N'Poteau H100 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-100-AN','de',N'Pfosten H100 cm - Anthrazit')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-AN','en',N'Post H150 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-AN','fr',N'Poteau H150 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-150-AN','de',N'Pfosten H150 cm - Anthrazit')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-AN','en',N'Post H185 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-AN','fr',N'Poteau H185 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-185-AN','de',N'Pfosten H185 cm - Anthrazit')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-AN','en',N'Post H200 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-AN','fr',N'Poteau H200 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('PAL-200-AN','de',N'Pfosten H200 cm - Anthrazit')
END
GO

-- Doghe BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'DOG-150-BI' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('DOG-150-BI','en',N'Horizontal slat L150 cm - White melange')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-BI','fr',N'Lame horizontale L150 cm - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-BI','de',N'Horizontalleiste L150 cm - Weiß melange')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-MA','en',N'Horizontal slat L150 cm - Brown')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-MA','fr',N'Lame horizontale L150 cm - Marron')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-MA','de',N'Horizontalleiste L150 cm - Braun')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-AN','en',N'Horizontal slat L150 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-AN','fr',N'Lame horizontale L150 cm - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('DOG-150-AN','de',N'Horizontalleiste L150 cm - Anthrazit')
END
GO

-- Cappellotti BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'ACC-CAP-BI' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-BI','en',N'Post cap - White melange')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-BI','fr',N'Chapeau poteau - Blanc mélange')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-BI','de',N'Pfostenkappe - Weiß melange')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-MA','en',N'Post cap - Brown')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-MA','fr',N'Chapeau poteau - Marron')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-MA','de',N'Pfostenkappe - Braun')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-AN','en',N'Post cap - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-AN','fr',N'Chapeau poteau - Anthracite')
    INSERT INTO ProdottiTrad VALUES ('ACC-CAP-AN','de',N'Pfostenkappe - Anthrazit')
END
GO

-- Cover
IF NOT EXISTS (SELECT 1 FROM ProdottiTrad WHERE PrdCod = 'COV-100-01' AND LangCode = 'en')
BEGIN
    INSERT INTO ProdottiTrad VALUES ('COV-100-01','en',N'Post groove cover H100 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-100-01','fr',N'Couvre-rainure poteau H100 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-100-01','de',N'Pfostennutabdeckung H100 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-150-01','en',N'Post groove cover H150 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-150-01','fr',N'Couvre-rainure poteau H150 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-150-01','de',N'Pfostennutabdeckung H150 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-185-01','en',N'Post groove cover H185 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-185-01','fr',N'Couvre-rainure poteau H185 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-185-01','de',N'Pfostennutabdeckung H185 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-200-01','en',N'Post groove cover H200 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-200-01','fr',N'Couvre-rainure poteau H200 cm')
    INSERT INTO ProdottiTrad VALUES ('COV-200-01','de',N'Pfostennutabdeckung H200 cm')
END
GO

-- ─── 5. Add prices for new products (listino pubblico) ──────

-- Pali BI (stessi prezzi del GR come base)
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'PAL-100-BI' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('PAL-100-BI','LSTPUB001', 25.00)
    INSERT INTO Prezzi VALUES ('PAL-150-BI','LSTPUB001', 35.00)
    INSERT INTO Prezzi VALUES ('PAL-185-BI','LSTPUB001', 45.00)
    INSERT INTO Prezzi VALUES ('PAL-200-BI','LSTPUB001', 50.00)
END
GO

-- Pali MA
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'PAL-100-MA' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('PAL-100-MA','LSTPUB001', 27.00)
    INSERT INTO Prezzi VALUES ('PAL-150-MA','LSTPUB001', 37.50)
    INSERT INTO Prezzi VALUES ('PAL-185-MA','LSTPUB001', 48.00)
    INSERT INTO Prezzi VALUES ('PAL-200-MA','LSTPUB001', 53.00)
END
GO

-- Pali AN
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'PAL-100-AN' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('PAL-100-AN','LSTPUB001', 27.00)
    INSERT INTO Prezzi VALUES ('PAL-150-AN','LSTPUB001', 37.50)
    INSERT INTO Prezzi VALUES ('PAL-185-AN','LSTPUB001', 48.00)
    INSERT INTO Prezzi VALUES ('PAL-200-AN','LSTPUB001', 53.00)
END
GO

-- Doghe BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'DOG-150-BI' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('DOG-150-BI','LSTPUB001', 12.50)
    INSERT INTO Prezzi VALUES ('DOG-150-MA','LSTPUB001', 13.50)
    INSERT INTO Prezzi VALUES ('DOG-150-AN','LSTPUB001', 13.50)
END
GO

-- Cappellotti BI/MA/AN
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'ACC-CAP-BI' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('ACC-CAP-BI','LSTPUB001', 3.50)
    INSERT INTO Prezzi VALUES ('ACC-CAP-MA','LSTPUB001', 4.00)
    INSERT INTO Prezzi VALUES ('ACC-CAP-AN','LSTPUB001', 4.00)
END
GO

-- Cover
IF NOT EXISTS (SELECT 1 FROM Prezzi WHERE PrdCod = 'COV-100-01' AND LstCod = 'LSTPUB001')
BEGIN
    INSERT INTO Prezzi VALUES ('COV-100-01','LSTPUB001', 2.50)
    INSERT INTO Prezzi VALUES ('COV-150-01','LSTPUB001', 3.00)
    INSERT INTO Prezzi VALUES ('COV-185-01','LSTPUB001', 3.50)
    INSERT INTO Prezzi VALUES ('COV-200-01','LSTPUB001', 4.00)
END
GO

PRINT '========================================================'
PRINT 'Migration complete: configurator products aligned.'
PRINT '  - DiBaCod/CfgColore set on existing products'
PRINT '  - New BI/MA/AN color variants added'
PRINT '  - COV-* cover products added'
PRINT '  - Prices and translations added'
PRINT '========================================================'
GO
