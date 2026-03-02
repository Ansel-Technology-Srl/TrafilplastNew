-- ============================================================
-- Migration: Set CfgTipo for CONF-REC product
-- Date: 2026-03-02
-- Description: Sets CfgTipo = 'recinzione' for the CONF-REC
--              product so it appears as configurable in the
--              catalog with a "Configura" button.
-- ============================================================

-- Set CfgTipo for all CONF-REC products (configurator fence)
UPDATE Prodotti
SET CfgTipo = 'recinzione'
WHERE PrdCod = 'CONF-REC'
  AND (CfgTipo IS NULL OR CfgTipo = '');

PRINT 'Migration complete: CfgTipo set for CONF-REC product.';
GO
