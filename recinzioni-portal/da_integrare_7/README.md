# Fase 7 — i18n Completo + Accessibilità WCAG 2.1 AA

> **Data:** 24 febbraio 2026  
> **Versione:** 1.0  
> **Dipendenze aggiuntive:** Nessuna (usa solo API native del browser + librerie già presenti)

---

## Contenuto del pacchetto

```
fase7-i18n-a11y/
├── frontend/
│   ├── src/
│   │   ├── utils/
│   │   │   └── formatters.js              ← NUOVO: utility formattazione localizzata
│   │   ├── hooks/
│   │   │   └── useFocusTrap.js            ← NUOVO: focus trap per modal
│   │   ├── components/
│   │   │   ├── SkipLinks.jsx              ← NUOVO: skip links accessibili
│   │   │   ├── AccessibleConfigurator.jsx ← NUOVO: alternativa testuale al 3D
│   │   │   └── Accessible3DCanvas.jsx     ← NUOVO: wrapper canvas con toggle
│   │   └── index-a11y-additions.css       ← DA APPENDERE a index.css
│   └── i18n-merge/
│       └── a11y-keys.json                 ← Chiavi a11y per IT/EN/FR/DE da mergere
├── tools/
│   └── check-i18n.js                      ← Script verifica completezza traduzioni
├── accessibility-fixes.md                 ← Audit WCAG con fix pagina per pagina
├── formatter-replacements.md              ← Lista sostituzioni formattazione hardcoded
└── README.md                              ← Questo file
```

---

## Istruzioni di installazione

### 1. Copiare i file nuovi

```bash
# Dalla root del progetto:

# Utility formatters
cp fase7-i18n-a11y/frontend/src/utils/formatters.js frontend/src/utils/

# Hook focus trap
mkdir -p frontend/src/hooks
cp fase7-i18n-a11y/frontend/src/hooks/useFocusTrap.js frontend/src/hooks/

# Componenti accessibilità
cp fase7-i18n-a11y/frontend/src/components/SkipLinks.jsx frontend/src/components/
cp fase7-i18n-a11y/frontend/src/components/AccessibleConfigurator.jsx frontend/src/components/
cp fase7-i18n-a11y/frontend/src/components/Accessible3DCanvas.jsx frontend/src/components/

# Script check i18n
cp fase7-i18n-a11y/tools/check-i18n.js tools/
```

### 2. Appendere CSS accessibilità

Copiare il contenuto di `index-a11y-additions.css` **in fondo** al file `frontend/src/index.css` esistente:

```bash
cat fase7-i18n-a11y/frontend/src/index-a11y-additions.css >> frontend/src/index.css
```

### 3. Mergere le chiavi i18n a11y nei file locale

Il file `a11y-keys.json` contiene la sezione `a11y.*` per tutte e 4 le lingue.  
Va aggiunta in fondo a ciascun file locale:

```bash
# Esempio manuale per it.json:
# Apri frontend/src/i18n/locales/it.json
# Aggiungi la sezione "a11y": { ... } dal file a11y-keys.json → chiave "it" → "a11y"
```

In alternativa, puoi usare questo one-liner Node.js:

```bash
node -e "
const fs = require('fs');
const a11y = JSON.parse(fs.readFileSync('fase7-i18n-a11y/frontend/i18n-merge/a11y-keys.json', 'utf-8'));
['it', 'en', 'fr', 'de'].forEach(lang => {
  const filePath = 'frontend/src/i18n/locales/' + lang + '.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  data.a11y = a11y[lang].a11y;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log('✅ Merged a11y keys into ' + lang + '.json');
});
"
```

### 4. Aggiornare App.jsx

Seguire le istruzioni in `accessibility-fixes.md`, sezione 1:
- Aggiungere `import SkipLinks`
- Aggiungere `useEffect` per `document.documentElement.lang`
- Inserire `<SkipLinks />` prima di `<BrowserRouter>`

### 5. Aggiornare Layout.jsx

Seguire le istruzioni in `accessibility-fixes.md`, sezione 2:
- Wrappare sidebar con `<nav id="main-nav" aria-label="...">`
- Wrappare contenuto con `<main id="main-content">`
- Aggiungere ARIA al menu mobile
- Aggiungere ARIA al selettore lingua (vicino al logout)
- Aggiungere ARIA al badge carrello

### 6. Applicare fix formattazione

Seguire `formatter-replacements.md` pagina per pagina:
- Aggiungere `const fmt = useFormatters();` in ogni componente
- Sostituire i pattern `€ ${value.toFixed(2)}` con `fmt.currency(value)`
- Sostituire i `.toLocaleDateString()` con `fmt.date(value)` o `fmt.dateTime(value)`

### 7. Applicare fix accessibilità restanti

Seguire `accessibility-fixes.md` per le sezioni 3-13:
- Form con label + aria-invalid + aria-describedby
- Tabelle con aria-label + scope="col"
- Loading spinner con role="status"
- Focus trap nei modal
- Icone con aria-hidden="true"

### 8. Verificare completezza traduzioni

```bash
node tools/check-i18n.js
# Output atteso: ✅ per tutte le lingue
```

---

## Checklist test accessibilità

### Navigazione tastiera
- [ ] Tab attraversa tutti gli elementi interattivi nell'ordine logico
- [ ] Shift+Tab inverte la direzione
- [ ] Enter attiva bottoni e link
- [ ] Escape chiude i modal
- [ ] Focus visibile (anello blu) su ogni elemento interattivo
- [ ] Skip links funzionano (Tab dalla pagina, appare "Vai al contenuto principale")
- [ ] Focus trap nei modal: Tab non esce dal modal aperto

### Screen reader (NVDA su Windows / VoiceOver su Mac)
- [ ] Tutte le pagine hanno landmark regions (nav, main)
- [ ] Le tabelle sono annunciate con il loro caption/aria-label
- [ ] I form hanno label letti correttamente
- [ ] Gli errori dei form sono annunciati (role="alert")
- [ ] Le icone decorative sono nascoste (aria-hidden="true")
- [ ] Il badge carrello annuncia il conteggio ("Carrello, 3 articoli")
- [ ] Il configuratore 3D ha l'alternativa testuale AccessibleConfigurator

### Contrasti colore
- [ ] Eseguire Lighthouse > Accessibilità (punteggio target: ≥ 90)
- [ ] Eseguire axe DevTools per verificare contrasti
- [ ] Verificare `text-primary-700` al posto di `text-primary-600` per il testo
- [ ] Verificare placeholder input usa `text-gray-500`

### Zoom e responsività
- [ ] Layout non si rompe a 200% zoom del browser
- [ ] Nessun contenuto tagliato orizzontalmente a 200%
- [ ] Il testo resta leggibile

### Reduced motion
- [ ] Attivare "Riduci movimento" nelle preferenze di sistema
- [ ] Verificare che le animazioni CSS si fermano
- [ ] Il configuratore 3D resta interattivo (OrbitControls)

### Formattazione localizzata
- [ ] Cambiare lingua a IT → prezzi mostrano "€ 1.234,56", date "24/02/2026"
- [ ] Cambiare lingua a EN → prezzi mostrano "€1,234.56", date "24/02/2026"
- [ ] Cambiare lingua a FR → prezzi mostrano "1 234,56 €", date "24/02/2026"
- [ ] Cambiare lingua a DE → prezzi mostrano "1.234,56 €", date "24.02.2026"

### Tool automatici consigliati
- [ ] `node tools/check-i18n.js` → tutte le lingue complete
- [ ] Chrome Lighthouse > Accessibilità ≥ 90
- [ ] Chrome axe DevTools extension → 0 errori critici
- [ ] Firefox Accessibility Inspector → nessun problema

---

## Note tecniche

### Contrasto primary-600 vs primary-700

Il colore `primary-600` (#2563eb) ha contrasto 3.96:1 su bianco — **non supera** WCAG AA per testo normale (serve 4.5:1). La fix proposta è usare `primary-700` (#1d4ed8, contrasto 5.56:1) per il **testo** linkato o primario. I **bottoni** con sfondo `primary-600` e testo bianco vanno bene (contrasto 4.54:1 per testo grande, e i bottoni hanno testo bold che conta come "testo grande").

### Canvas Three.js

Il canvas WebGL non è accessibile per natura. La soluzione è il componente `Accessible3DCanvas` che offre un toggle tra vista 3D e vista testuale (`AccessibleConfigurator`). L'alternativa testuale mostra:
- Riepilogo parametri (colore, fissaggio, doghe, altezza)
- Tabella sezioni con lunghezza e angolo
- Tabella distinta base con prezzi formattati
- `aria-live="polite"` per annunciare modifiche in tempo reale

### react-hot-toast

La libreria ha già `role="alert"` e `aria-live="assertive"` di default. Non servono configurazioni aggiuntive.

### Selettore lingua

Come indicato nelle specifiche, il selettore lingua si trova nel contenitore vicino alla voce di logout (nella parte superiore del Layout, non nella sidebar). Le fix ARIA nel `accessibility-fixes.md` si riferiscono a questa posizione.
