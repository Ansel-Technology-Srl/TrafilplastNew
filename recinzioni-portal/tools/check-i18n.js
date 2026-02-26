#!/usr/bin/env node
/**
 * check-i18n.js — Verifica completezza traduzioni i18n.
 *
 * Confronta le chiavi di en.json, fr.json, de.json con it.json (baseline).
 * Elenca chiavi mancanti e chiavi extra per ogni lingua.
 *
 * USO:
 *   node tools/check-i18n.js
 *   node tools/check-i18n.js --path ./frontend/src/i18n/locales
 *   node tools/check-i18n.js --verbose
 *
 * OUTPUT:
 *   ✅ en.json: 245/245 chiavi OK
 *   ⚠️  fr.json: 3 chiavi mancanti
 *      - orders.euritmo.recordTypes.bgm
 *      - orders.euritmo.recordTypes.lin
 *      - a11y.sortAscending
 *   ⚠️  de.json: 5 chiavi mancanti
 *      - ...
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const pathIdx = args.indexOf('--path');
const localesDir = pathIdx !== -1 && args[pathIdx + 1]
  ? path.resolve(args[pathIdx + 1])
  : path.resolve(__dirname, '../frontend/src/i18n/locales');

const BASELINE = 'it';
const LANGUAGES = ['en', 'fr', 'de'];

// ─── UTILITIES ───────────────────────────────────────────────

/**
 * Estrae ricorsivamente tutte le chiavi flat da un oggetto JSON.
 * { a: { b: "x", c: "y" } } → ["a.b", "a.c"]
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Carica e parsa un file JSON. Ritorna null se non esiste.
 */
function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Trova chiavi con valore vuoto ("" o solo spazi)
 */
function findEmptyValues(obj, prefix = '') {
  const emptyKeys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      emptyKeys.push(...findEmptyValues(obj[key], fullKey));
    } else if (typeof obj[key] === 'string' && obj[key].trim() === '') {
      emptyKeys.push(fullKey);
    }
  }
  return emptyKeys;
}

/**
 * Trova chiavi che sembrano non tradotte (identiche al baseline IT)
 */
function findUntranslated(baselineObj, targetObj, prefix = '') {
  const untranslated = [];
  for (const key of Object.keys(baselineObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof baselineObj[key] === 'object' && baselineObj[key] !== null) {
      if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
        untranslated.push(...findUntranslated(baselineObj[key], targetObj[key], fullKey));
      }
    } else if (typeof baselineObj[key] === 'string' && typeof targetObj[key] === 'string') {
      // Ignora chiavi che contengono solo interpolazioni {{...}} o sono nomi propri/codici
      const isInterpolationOnly = /^(\{\{[^}]+\}\}[\s,./;:]*)+$/.test(baselineObj[key]);
      if (!isInterpolationOnly && baselineObj[key] === targetObj[key] && baselineObj[key].length > 3) {
        untranslated.push(fullKey);
      }
    }
  }
  return untranslated;
}

// ─── MAIN ────────────────────────────────────────────────────

console.log('');
console.log('🌐 Verifica completezza i18n');
console.log(`   Cartella: ${localesDir}`);
console.log(`   Baseline: ${BASELINE}.json`);
console.log('');

// Carica baseline
const baselinePath = path.join(localesDir, `${BASELINE}.json`);
const baselineData = loadJSON(baselinePath);

if (!baselineData) {
  console.error(`❌ File baseline non trovato: ${baselinePath}`);
  process.exit(1);
}

const baselineKeys = flattenKeys(baselineData);
const baselineSet = new Set(baselineKeys);

console.log(`📋 ${BASELINE}.json: ${baselineKeys.length} chiavi (baseline)`);

let hasErrors = false;

// Controlla ogni lingua
for (const lang of LANGUAGES) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const data = loadJSON(filePath);

  if (!data) {
    console.log(`❌ ${lang}.json: FILE NON TROVATO`);
    hasErrors = true;
    continue;
  }

  const langKeys = flattenKeys(data);
  const langSet = new Set(langKeys);

  // Chiavi mancanti (presenti in IT ma non nella lingua)
  const missing = baselineKeys.filter(k => !langSet.has(k));

  // Chiavi extra (presenti nella lingua ma non in IT)
  const extra = langKeys.filter(k => !baselineSet.has(k));

  // Valori vuoti
  const empty = findEmptyValues(data);

  // Potenzialmente non tradotte (verbose only)
  const untranslated = verbose ? findUntranslated(baselineData, data) : [];

  const okCount = baselineKeys.length - missing.length;
  const allOk = missing.length === 0 && empty.length === 0;

  if (allOk && extra.length === 0) {
    console.log(`✅ ${lang}.json: ${okCount}/${baselineKeys.length} chiavi OK`);
  } else {
    hasErrors = true;
    console.log(`⚠️  ${lang}.json: ${okCount}/${baselineKeys.length} chiavi`);

    if (missing.length > 0) {
      console.log(`   📌 ${missing.length} chiavi mancanti:`);
      missing.forEach(k => console.log(`      - ${k}`));
    }

    if (empty.length > 0) {
      console.log(`   🔲 ${empty.length} valori vuoti:`);
      empty.forEach(k => console.log(`      - ${k}`));
    }

    if (extra.length > 0) {
      console.log(`   ➕ ${extra.length} chiavi extra (non in ${BASELINE}):`);
      extra.forEach(k => console.log(`      - ${k}`));
    }
  }

  if (verbose && untranslated.length > 0) {
    console.log(`   🔤 ${untranslated.length} chiavi potenzialmente non tradotte (identiche a IT):`);
    untranslated.slice(0, 20).forEach(k => console.log(`      - ${k}`));
    if (untranslated.length > 20) {
      console.log(`      ... e altre ${untranslated.length - 20}`);
    }
  }

  console.log('');
}

// Riepilogo
console.log('─'.repeat(50));
if (hasErrors) {
  console.log('⚠️  Traduzioni incomplete. Correggi le chiavi sopra elencate.');
  process.exit(1);
} else {
  console.log('✅ Tutte le traduzioni sono complete e allineate.');
  process.exit(0);
}
