-- ══════════════════════════════════════════════════════════════════════════════
--  07_euritmo_config.sql — Tabella configurazione EURITMO (OPZIONALE)
--
--  Questa tabella è un'alternativa a appsettings.json per la configurazione EDI.
--  Se preferisci gestire la configurazione da DB (es. con una pagina admin),
--  usa questa tabella. Altrimenti usa appsettings.json e ignora questo script.
-- ══════════════════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'EuritmoConfig')
BEGIN
    CREATE TABLE EuritmoConfig (
        ConfigKey       VARCHAR(64)     NOT NULL PRIMARY KEY,
        ConfigValue     NVARCHAR(512)   NOT NULL DEFAULT '',
        Descrizione     NVARCHAR(256)   NULL,
        UltimaModifica  DATETIME        NOT NULL DEFAULT GETDATE()
    );

    -- Seed con valori di default
    INSERT INTO EuritmoConfig (ConfigKey, ConfigValue, Descrizione) VALUES
    ('IdEdiMittente',               'PLACEHOLDER_MITTENTE',         'ID EDI mittente (P.IVA o EAN) — Q3 aperta'),
    ('QualificatoreMittente',       'ZZ',                           'ZZ=accordo, VA=P.IVA, 14=EAN'),
    ('IdEdiDestinatario',           'PLACEHOLDER_DESTINATARIO',     'ID EDI destinatario (fornitore) — Q3 aperta'),
    ('QualificatoreDestinatario',   'ZZ',                           'ZZ=accordo, VA=P.IVA, 14=EAN'),
    ('FornitoreRagSoc',             'Fornitore Recinzioni Srl',     'Ragione sociale fornitore'),
    ('FornitoreIndirizzo',          'Via Industriale 1',            'Indirizzo fornitore'),
    ('FornitoreCitta',              'Padova',                       'Città fornitore'),
    ('FornitoreProvincia',          'PD',                           'Provincia fornitore'),
    ('FornitoreCap',                '35100',                        'CAP fornitore'),
    ('FornitoreNazione',            'IT',                           'Nazione ISO fornitore'),
    ('FornitorePIva',               '',                             'P.IVA fornitore (se nota)'),
    ('FornitoreTelefono',           '',                             'Telefono contatto ordini'),
    ('FornitoreEmail',              'ordini@fornitore.example.com', 'Email per invio ordini EDI'),
    ('GiorniConsegnaDefault',       '7',                            'Giorni da aggiungere a data ordine per data consegna'),
    ('ArchivioPath',                'wwwroot/euritmo',              'Percorso archivio file .edi');

    PRINT 'Tabella EuritmoConfig creata con dati di default.';
END
ELSE
BEGIN
    PRINT 'Tabella EuritmoConfig già esistente — nessuna modifica.';
END
GO
