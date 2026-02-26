# Sostituzioni Formattazione — Da hardcoded a `formatters.js`

> Questo documento elenca tutti i punti dove la formattazione di prezzi, date e numeri
> va sostituita con le funzioni del modulo `src/utils/formatters.js`.

## Setup: come usare i formatter

### Opzione A — Hook (consigliato per i componenti)

```jsx
import { useFormatters } from '../utils/formatters';

function MyComponent() {
  const fmt = useFormatters();
  return <span>{fmt.currency(price)}</span>;
}
```

### Opzione B — Funzione diretta (per utility o fuori da componenti React)

```jsx
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const formatted = formatCurrency(1234.56, i18n.language);
```

---

## 1. CatalogPage.jsx

### Prezzi prodotti nella griglia

**Vecchio:**
```jsx
<span className="text-lg font-bold">€ {Number(product.prezzo).toFixed(2)}</span>
```

**Nuovo:**
```jsx
const fmt = useFormatters();
// ...
<span className="text-lg font-bold">{fmt.currency(product.prezzo)}</span>
```

### Prezzo nel dettaglio prodotto (se inline)

**Vecchio:**
```jsx
<span>€ {product.prezzo?.toFixed(2) || '—'}</span>
```

**Nuovo:**
```jsx
<span>{fmt.currency(product.prezzo)}</span>
```

---

## 2. ProductDetailModal.jsx

### Prezzo dettaglio

**Vecchio:**
```jsx
<p className="text-2xl font-bold text-primary-600">
  € {Number(product.prezzo).toFixed(2)}
</p>
```

**Nuovo:**
```jsx
<p className="text-2xl font-bold text-primary-700">
  {fmt.currency(product.prezzo)}
</p>
```

> NOTA: anche il colore cambia da `primary-600` a `primary-700` per il contrasto (vedi accessibility-fixes.md).

---

## 3. ConfiguratorPage.jsx

### Prezzi nella distinta base

**Vecchio:**
```jsx
{distintaBase.map(row => (
  <tr key={row.codice}>
    <td>{row.codice}</td>
    <td>{row.descrizione}</td>
    <td className="text-right">{row.quantita}</td>
    <td>{row.um}</td>
    <td className="text-right">€ {Number(row.prezzoUnitario).toFixed(2)}</td>
    <td className="text-right font-bold">€ {Number(row.totale).toFixed(2)}</td>
  </tr>
))}
```

**Nuovo:**
```jsx
{distintaBase.map(row => (
  <tr key={row.codice}>
    <td>{row.codice}</td>
    <td>{row.descrizione}</td>
    <td className="text-right">{fmt.quantity(row.quantita)}</td>
    <td>{row.um}</td>
    <td className="text-right">{fmt.currency(row.prezzoUnitario)}</td>
    <td className="text-right font-bold">{fmt.currency(row.totale)}</td>
  </tr>
))}
```

### Totale distinta base

**Vecchio:**
```jsx
<span className="text-xl font-bold">Totale: € {totale.toFixed(2)}</span>
```

**Nuovo:**
```jsx
<span className="text-xl font-bold">{t('configurator.total')}: {fmt.currency(totale)}</span>
```

---

## 4. CartPage.jsx

### Prezzo unitario e totale riga

**Vecchio:**
```jsx
<td className="text-right">€ {(item.price).toFixed(2)}</td>
<td className="text-right">€ {(item.price * item.quantity).toFixed(2)}</td>
```

**Nuovo:**
```jsx
<td className="text-right">{fmt.currency(item.price)}</td>
<td className="text-right">{fmt.currency(item.price * item.quantity)}</td>
```

### Subtotale, IVA, Totale

**Vecchio:**
```jsx
<div>Subtotale: € {subtotal.toFixed(2)}</div>
<div>IVA (22%): € {vat.toFixed(2)}</div>
<div>Totale: € {total.toFixed(2)}</div>
```

**Nuovo:**
```jsx
<div>{t('cart.subtotal')}: {fmt.currency(subtotal)}</div>
<div>{t('cart.vat')}: {fmt.currency(vat)}</div>
<div>{t('cart.total')}: {fmt.currency(total)}</div>
```

---

## 5. QuoteFormPage.jsx

### Riepilogo importi

Stessa logica di CartPage: sostituire tutti i `€ ${value.toFixed(2)}` con `fmt.currency(value)`.

---

## 6. OrdersPage.jsx

### Totale in lista ordini

**Vecchio:**
```jsx
<td className="text-right">€ {Number(order.totale).toFixed(2)}</td>
```

**Nuovo:**
```jsx
<td className="text-right">{fmt.currency(order.totale)}</td>
```

### Data ordine

**Vecchio:**
```jsx
<td>{new Date(order.dataOrdine).toLocaleDateString()}</td>
```

**Nuovo:**
```jsx
<td>{fmt.date(order.dataOrdine)}</td>
```

### Data invio fornitore

**Vecchio:**
```jsx
<td>{order.dataInvio ? new Date(order.dataInvio).toLocaleDateString() : '—'}</td>
```

**Nuovo:**
```jsx
<td>{order.dataInvio ? fmt.dateTime(order.dataInvio) : '—'}</td>
```

### Dettaglio ordine — Prezzi righe

**Vecchio:**
```jsx
<td>€ {Number(riga.prezzoUnitario).toFixed(2)}</td>
<td>€ {Number(riga.totaleRiga).toFixed(2)}</td>
```

**Nuovo:**
```jsx
<td>{fmt.currency(riga.prezzoUnitario)}</td>
<td>{fmt.currency(riga.totaleRiga)}</td>
```

---

## 7. PriceListsPage.jsx

### Prezzi nel listino

**Vecchio:**
```jsx
<td className="text-right">€ {Number(row.prdPrz).toFixed(2)}</td>
```

**Nuovo:**
```jsx
<td className="text-right">{fmt.currency(row.prdPrz)}</td>
```

### Date validità

**Vecchio:**
```jsx
<span>{new Date(validoDal).toLocaleDateString()} — {new Date(validoAl).toLocaleDateString()}</span>
```

**Nuovo:**
```jsx
<span>{fmt.date(validoDal)} — {fmt.date(validoAl)}</span>
```

### Differenza percentuale

**Vecchio:**
```jsx
<span className={diff > 0 ? 'text-red-600' : 'text-green-600'}>
  {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
</span>
```

**Nuovo:**
```jsx
<span className={diff > 0 ? 'text-red-600' : 'text-green-600'}>
  {diff > 0 ? '+' : ''}{fmt.number(diff * 100, 1)}%
</span>
```

> Nota: `formatPercent` prende un decimale (0.22 → "22%"), ma qui `diff` è già in percentuale, 
> quindi usiamo `formatNumber` per le cifre + il simbolo % hardcoded.
> Alternativa: `{diff > 0 ? '+' : ''}{fmt.percent(diff / 100)}`

---

## 8. admin/ImportPage.jsx (opzionale, meno critico)

### Conteggi dashboard

**Vecchio:**
```jsx
<span className="text-2xl font-bold">{counts.prodotti}</span>
```

**Nuovo:**
```jsx
<span className="text-2xl font-bold">{fmt.number(counts.prodotti, 0)}</span>
```

> Questo è opzionale perché i conteggi sono numeri piccoli, ma per coerenza
> e per lingue che usano separatori diversi anche sui numeri, è meglio formattare.

---

## Riepilogo sostituzioni

| Pagina | Tipo | Pattern vecchio | Pattern nuovo | Priorità |
|--------|------|----------------|---------------|----------|
| CatalogPage | Prezzo | `€ ${v.toFixed(2)}` | `fmt.currency(v)` | Alta |
| ProductDetailModal | Prezzo | `€ ${v.toFixed(2)}` | `fmt.currency(v)` | Alta |
| ConfiguratorPage | Prezzo + Qty | `.toFixed(2)` | `fmt.currency()` / `fmt.quantity()` | Alta |
| CartPage | Prezzo | `.toFixed(2)` | `fmt.currency()` | Alta |
| QuoteFormPage | Prezzo | `.toFixed(2)` | `fmt.currency()` | Alta |
| OrdersPage | Prezzo + Date | `.toFixed(2)` + `.toLocaleDateString()` | `fmt.currency()` + `fmt.date()` | Alta |
| PriceListsPage | Prezzo + Date + % | `.toFixed(2)` + `.toLocaleDateString()` | `fmt.currency()` + `fmt.date()` + `fmt.number()` | Alta |
| ImportPage | Conteggi | numeri grezzi | `fmt.number(v, 0)` | Bassa |
