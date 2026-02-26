-- ============================================================
-- Migration: Add configuration columns to Prodotti table
-- Date: 2026-02-25
-- Description: Adds CfgTipo and CfgColore columns to Prodotti
--   CfgTipo: configuration type name (e.g. "recinzione")
--            determines which configurator form to use.
--            NULL means the product is not configurable.
--   CfgColore: component color code (e.g. "GR", "VE", "RO")
--              used by the BOM to select the correct product
--              based on the user's chosen color.
-- ============================================================

-- Add CfgTipo column (configuration type)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Prodotti') AND name = 'CfgTipo')
BEGIN
    ALTER TABLE Prodotti ADD CfgTipo NVARCHAR(32) NULL;
    PRINT 'Added column CfgTipo to Prodotti';
END
GO

-- Add CfgColore column (component color code)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Prodotti') AND name = 'CfgColore')
BEGIN
    ALTER TABLE Prodotti ADD CfgColore NVARCHAR(16) NULL;
    PRINT 'Added column CfgColore to Prodotti';
END
GO

PRINT 'Migration complete: Prodotti configuration columns added.';
GO
