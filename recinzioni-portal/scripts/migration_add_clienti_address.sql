-- ============================================================
-- Migration: Add billing address columns to Clienti table
-- Date: 2026-02-25
-- Description: Adds Ind, Cap, Loc, Pro columns to Clienti
--   to store the legal/billing address separately from PdV.
-- ============================================================

-- Check if columns exist before adding (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clienti') AND name = 'Ind')
BEGIN
    ALTER TABLE Clienti ADD Ind NVARCHAR(256) NULL;
    PRINT 'Added column Ind to Clienti';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clienti') AND name = 'Cap')
BEGIN
    ALTER TABLE Clienti ADD Cap NVARCHAR(16) NULL;
    PRINT 'Added column Cap to Clienti';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clienti') AND name = 'Loc')
BEGIN
    ALTER TABLE Clienti ADD Loc NVARCHAR(128) NULL;
    PRINT 'Added column Loc to Clienti';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clienti') AND name = 'Pro')
BEGIN
    ALTER TABLE Clienti ADD Pro NVARCHAR(16) NULL;
    PRINT 'Added column Pro to Clienti';
END
GO

PRINT 'Migration complete: Clienti billing address columns added.';
GO
