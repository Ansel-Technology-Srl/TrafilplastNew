/**
 * Utility di formattazione localizzata
 * Usa Intl.NumberFormat e Intl.DateTimeFormat nativi del browser.
 *
 * Lingue supportate: it, en, fr, de
 * Valuta: EUR per tutte le lingue
 *
 * USO:
 *   import { formatCurrency, formatDate } from '../utils/formatters';
 *   import { useTranslation } from 'react-i18next';
 *   const { i18n } = useTranslation();
 *   formatCurrency(1234.56, i18n.language)  // → "1.234,56 €" (it)
 */

// Mappa locale BCP-47 completa per Intl
const LOCALE_MAP = {
  it: 'it-IT',
  en: 'en-GB',   // en-GB usa EUR con formato europeo; se si preferisce en-US cambiare qui
  fr: 'fr-FR',
  de: 'de-DE',
};

function resolveLocale(lang) {
  return LOCALE_MAP[lang] || LOCALE_MAP.it;
}

// ─── NUMERI ──────────────────────────────────────────────────

/**
 * Formatta un numero con separatori di migliaia e decimali localizzati.
 * @param {number|string} value
 * @param {string} lang - codice lingua (it|en|fr|de)
 * @param {number} [decimals=2] - cifre decimali
 * @returns {string}
 */
export function formatNumber(value, lang, decimals = 2) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat(resolveLocale(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatta un importo in euro secondo la lingua corrente.
 * it: € 1.234,56  |  en: €1,234.56  |  fr: 1 234,56 €  |  de: 1.234,56 €
 */
export function formatCurrency(value, lang) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat(resolveLocale(lang), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formatta una percentuale.
 * 0.22 → "22%" (it,en) | "22 %" (fr,de)
 */
export function formatPercent(value, lang) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat(resolveLocale(lang), {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─── DATE ────────────────────────────────────────────────────

/**
 * Formatta una data (stringa ISO o Date) nel formato corto locale.
 * it: 24/02/2026  |  en: 24/02/2026  |  fr: 24/02/2026  |  de: 24.02.2026
 */
export function formatDate(dateStr, lang) {
  if (!dateStr) return '—';
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(resolveLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatta data + ora.
 * it: 24/02/2026 14:30  |  de: 24.02.2026, 14:30
 */
export function formatDateTime(dateStr, lang) {
  if (!dateStr) return '—';
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(resolveLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Formatta una data nel formato lungo (es. "24 febbraio 2026").
 */
export function formatDateLong(dateStr, lang) {
  if (!dateStr) return '—';
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(resolveLocale(lang), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// ─── QUANTITÀ ────────────────────────────────────────────────

/**
 * Formatta una quantità (numero intero o con decimali variabili).
 * Mostra decimali solo se presenti.
 */
export function formatQuantity(value, lang) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  const hasDecimals = num % 1 !== 0;
  return new Intl.NumberFormat(resolveLocale(lang), {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasDecimals ? 3 : 0,
  }).format(num);
}

// ─── HOOK REACT ──────────────────────────────────────────────

/**
 * Hook React per avere i formatter già collegati alla lingua corrente.
 *
 * USO:
 *   import { useFormatters } from '../utils/formatters';
 *   const fmt = useFormatters();
 *   <span>{fmt.currency(product.price)}</span>
 *   <span>{fmt.date(order.createdAt)}</span>
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useFormatters() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return useMemo(() => ({
    number:    (v, dec) => formatNumber(v, lang, dec),
    currency:  (v) => formatCurrency(v, lang),
    percent:   (v) => formatPercent(v, lang),
    date:      (v) => formatDate(v, lang),
    dateTime:  (v) => formatDateTime(v, lang),
    dateLong:  (v) => formatDateLong(v, lang),
    quantity:  (v) => formatQuantity(v, lang),
    lang,
  }), [lang]);
}
