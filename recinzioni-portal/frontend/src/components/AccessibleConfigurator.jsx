/**
 * AccessibleConfigurator — Alternativa testuale/tabellare al configuratore 3D.
 *
 * Mostra un riepilogo della recinzione configurata leggibile da screen reader.
 * Aggiorna automaticamente (aria-live="polite") quando cambiano i parametri.
 *
 * Props:
 *   - config: oggetto configurazione corrente
 *     { color, groundType, slatsType, poleHeight, sections: [{ length, angle }] }
 *   - bom: array distinta base [{ code, description, quantity, unit, unitPrice, total }]
 *   - lang: lingua corrente (it|en|fr|de)
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../utils/formatters';

// Traduzioni inline per le etichette specifiche del configuratore accessibile
const LABELS = {
  it: {
    title: 'Riepilogo configurazione recinzione',
    color: 'Colore',
    ground: 'Tipo fissaggio',
    slats: 'Tipo doghe',
    poleHeight: 'Altezza pali',
    cm: 'cm',
    sections: 'Sezioni',
    sectionN: 'Sezione',
    length: 'Lunghezza',
    angle: 'Angolo',
    straight: 'dritto',
    bom: 'Distinta base',
    code: 'Codice',
    description: 'Descrizione',
    quantity: 'Quantità',
    unit: 'U.M.',
    unitPrice: 'Prezzo unit.',
    total: 'Totale',
    noSections: 'Nessuna sezione configurata.',
    noBom: 'Distinta base non ancora calcolata.',
    totalBom: 'Totale distinta base',
    groundTypes: { cement: 'Cemento', ground: 'Terra', wall: 'Muro' },
    slatsTypes: { persiana: 'Persiana', pieno: 'Pieno' },
  },
  en: {
    title: 'Fence configuration summary',
    color: 'Color',
    ground: 'Fixing type',
    slats: 'Slat type',
    poleHeight: 'Pole height',
    cm: 'cm',
    sections: 'Sections',
    sectionN: 'Section',
    length: 'Length',
    angle: 'Angle',
    straight: 'straight',
    bom: 'Bill of materials',
    code: 'Code',
    description: 'Description',
    quantity: 'Quantity',
    unit: 'Unit',
    unitPrice: 'Unit price',
    total: 'Total',
    noSections: 'No sections configured.',
    noBom: 'Bill of materials not calculated yet.',
    totalBom: 'Bill of materials total',
    groundTypes: { cement: 'Concrete', ground: 'Ground', wall: 'Wall' },
    slatsTypes: { persiana: 'Louvered', pieno: 'Solid' },
  },
  fr: {
    title: 'Résumé de la configuration de clôture',
    color: 'Couleur',
    ground: 'Type de fixation',
    slats: 'Type de lames',
    poleHeight: 'Hauteur des poteaux',
    cm: 'cm',
    sections: 'Sections',
    sectionN: 'Section',
    length: 'Longueur',
    angle: 'Angle',
    straight: 'droit',
    bom: 'Nomenclature',
    code: 'Code',
    description: 'Description',
    quantity: 'Quantité',
    unit: 'Unité',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    noSections: 'Aucune section configurée.',
    noBom: 'Nomenclature pas encore calculée.',
    totalBom: 'Total nomenclature',
    groundTypes: { cement: 'Béton', ground: 'Terre', wall: 'Mur' },
    slatsTypes: { persiana: 'Persienne', pieno: 'Plein' },
  },
  de: {
    title: 'Zusammenfassung der Zaunhkonfiguration',
    color: 'Farbe',
    ground: 'Befestigungsart',
    slats: 'Lamellentyp',
    poleHeight: 'Pfostenhöhe',
    cm: 'cm',
    sections: 'Abschnitte',
    sectionN: 'Abschnitt',
    length: 'Länge',
    angle: 'Winkel',
    straight: 'gerade',
    bom: 'Stückliste',
    code: 'Code',
    description: 'Beschreibung',
    quantity: 'Menge',
    unit: 'Einheit',
    unitPrice: 'Stückpreis',
    total: 'Gesamt',
    noSections: 'Keine Abschnitte konfiguriert.',
    noBom: 'Stückliste noch nicht berechnet.',
    totalBom: 'Stückliste Gesamt',
    groundTypes: { cement: 'Beton', ground: 'Erde', wall: 'Wand' },
    slatsTypes: { persiana: 'Lamelle', pieno: 'Geschlossen' },
  },
};

export default function AccessibleConfigurator({ config, bom }) {
  const { i18n, t } = useTranslation();
  const fmt = useFormatters();
  const lang = i18n.language;
  const L = LABELS[lang] || LABELS.it;

  // Genera descrizione testuale completa per screen reader
  const textDescription = useMemo(() => {
    if (!config) return '';
    const sections = config.sections || [];
    const sectionDesc = sections.map((s, i) => {
      const angleDesc = s.angle && s.angle !== 0 && s.angle !== 180
        ? `${s.angle}°`
        : L.straight;
      return `${L.sectionN} ${i + 1}: ${s.length}${L.cm} ${angleDesc}`;
    }).join('. ');

    return t('a11y.fenceDescription', {
      sections: sections.length,
      height: config.poleHeight,
      slatsType: L.slatsTypes[config.slatsType] || config.slatsType,
      color: config.color,
      ground: L.groundTypes[config.groundType] || config.groundType,
    }) + (sectionDesc ? `. ${sectionDesc}.` : '');
  }, [config, lang, t, L]);

  const bomTotal = useMemo(() => {
    if (!bom || bom.length === 0) return 0;
    return bom.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  }, [bom]);

  if (!config) return null;

  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4"
      role="region"
      aria-label={L.title}
    >
      {/* Descrizione live per screen reader */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {textDescription}
      </div>

      {/* Titolo visibile */}
      <h3 className="text-lg font-semibold text-gray-800">{L.title}</h3>

      {/* Parametri principali */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium text-gray-600">{L.color}</dt>
        <dd className="text-gray-900">{config.color || '—'}</dd>

        <dt className="font-medium text-gray-600">{L.ground}</dt>
        <dd className="text-gray-900">{L.groundTypes[config.groundType] || config.groundType || '—'}</dd>

        <dt className="font-medium text-gray-600">{L.slats}</dt>
        <dd className="text-gray-900">{L.slatsTypes[config.slatsType] || config.slatsType || '—'}</dd>

        <dt className="font-medium text-gray-600">{L.poleHeight}</dt>
        <dd className="text-gray-900">{config.poleHeight ? `${config.poleHeight} ${L.cm}` : '—'}</dd>
      </dl>

      {/* Tabella sezioni */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{L.sections}</h4>
        {(!config.sections || config.sections.length === 0) ? (
          <p className="text-sm text-gray-500 italic">{L.noSections}</p>
        ) : (
          <table className="w-full text-sm border-collapse" aria-label={t('a11y.tableCaption.bom', 'Tabella sezioni della recinzione')}>
            <thead>
              <tr className="border-b border-gray-300">
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">#</th>
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">{L.length}</th>
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">{L.angle}</th>
              </tr>
            </thead>
            <tbody>
              {config.sections.map((section, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-1 px-2">{idx + 1}</td>
                  <td className="py-1 px-2">{section.length} {L.cm}</td>
                  <td className="py-1 px-2">
                    {section.angle && section.angle !== 0 && section.angle !== 180
                      ? `${section.angle}°`
                      : L.straight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tabella distinta base */}
      {bom && bom.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{L.bom}</h4>
          <table
            className="w-full text-sm border-collapse"
            aria-label={t('a11y.tableCaption.bom', 'Tabella distinta base della recinzione')}
          >
            <thead>
              <tr className="border-b border-gray-300">
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">{L.code}</th>
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">{L.description}</th>
                <th scope="col" className="text-right py-1 px-2 font-medium text-gray-600">{L.quantity}</th>
                <th scope="col" className="text-left py-1 px-2 font-medium text-gray-600">{L.unit}</th>
                <th scope="col" className="text-right py-1 px-2 font-medium text-gray-600">{L.unitPrice}</th>
                <th scope="col" className="text-right py-1 px-2 font-medium text-gray-600">{L.total}</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-1 px-2 font-mono text-xs">{row.code}</td>
                  <td className="py-1 px-2">{row.description}</td>
                  <td className="py-1 px-2 text-right">{fmt.quantity(row.quantity)}</td>
                  <td className="py-1 px-2">{row.unit}</td>
                  <td className="py-1 px-2 text-right">{fmt.currency(row.unitPrice)}</td>
                  <td className="py-1 px-2 text-right font-medium">{fmt.currency(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400">
                <td colSpan={5} className="py-2 px-2 text-right font-semibold">{L.totalBom}</td>
                <td className="py-2 px-2 text-right font-bold text-primary-700">{fmt.currency(bomTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {(!bom || bom.length === 0) && (
        <p className="text-sm text-gray-500 italic">{L.noBom}</p>
      )}
    </div>
  );
}
