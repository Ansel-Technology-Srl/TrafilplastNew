# Audit Accessibilità WCAG 2.1 AA — Fix per pagina

> Questo documento elenca tutte le fix di accessibilità da applicare alle pagine esistenti.
> Per ogni fix: vecchio codice → nuovo codice con commento al criterio WCAG.

---

## 1. App.jsx — Attributo `lang` e SkipLinks

### Fix 1.1 — Aggiungere effetto per `lang` su `<html>` (WCAG 3.1.1)

Aggiungere in App.jsx, dentro il componente principale:

```jsx
// AGGIUNGERE import
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import SkipLinks from './components/SkipLinks';

function App() {
  const { i18n } = useTranslation();

  // AGGIUNGERE: imposta attributo lang su <html>
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <>
      {/* AGGIUNGERE: prima di BrowserRouter */}
      <SkipLinks />
      <BrowserRouter>
        {/* ... routing esistente ... */}
      </BrowserRouter>
    </>
  );
}
```

---

## 2. Layout.jsx — Landmark ARIA + Sidebar accessibile

### Fix 2.1 — `<nav>` con aria-label (WCAG 1.3.1, 4.1.2)

**Vecchio:**
```jsx
<div className="sidebar ...">
  <div className="nav-items">
    {/* voci menu */}
  </div>
</div>
```

**Nuovo:**
```jsx
<nav id="main-nav" aria-label={t('nav.mainNavigation', 'Navigazione principale')} className="sidebar ...">
  <div className="nav-items" role="list">
    {/* voci menu con role="listitem" */}
  </div>
</nav>
```

### Fix 2.2 — `<main>` attorno al contenuto (WCAG 1.3.1)

**Vecchio:**
```jsx
<div className="content-area ...">
  {children}
</div>
```

**Nuovo:**
```jsx
<main id="main-content" className="content-area ..." tabIndex={-1}>
  {children}
</main>
```

### Fix 2.3 — Menu mobile con ARIA (WCAG 4.1.2)

**Vecchio:**
```jsx
<button onClick={() => setMenuOpen(!menuOpen)}>
  <Menu size={24} />
</button>
```

**Nuovo:**
```jsx
<button
  onClick={() => setMenuOpen(!menuOpen)}
  aria-expanded={menuOpen}
  aria-controls="main-nav"
  aria-label={menuOpen ? t('a11y.menuClose') : t('a11y.menuOpen')}
>
  <Menu size={24} aria-hidden="true" />
</button>
```

### Fix 2.4 — Selettore lingua accessibile (WCAG 4.1.2)

**Vecchio:**
```jsx
<div className="language-selector">
  {['it', 'en', 'fr', 'de'].map(lang => (
    <button key={lang} onClick={() => changeLanguage(lang)}
            className={i18n.language === lang ? 'active' : ''}>
      {lang.toUpperCase()}
    </button>
  ))}
</div>
```

**Nuovo:**
```jsx
<div className="language-selector" role="group" aria-label={t('a11y.selectLanguage')}>
  {['it', 'en', 'fr', 'de'].map(lang => (
    <button
      key={lang}
      onClick={() => changeLanguage(lang)}
      className={i18n.language === lang ? 'active' : ''}
      aria-current={i18n.language === lang ? 'true' : undefined}
      aria-label={t('a11y.currentLanguage', { lang: lang.toUpperCase() })}
    >
      {lang.toUpperCase()}
    </button>
  ))}
</div>
```

### Fix 2.5 — Badge carrello accessibile (WCAG 4.1.2)

**Vecchio:**
```jsx
<Link to="/carrello" className="...">
  <ShoppingCart size={20} />
  {cartCount > 0 && <span className="badge">{cartCount}</span>}
</Link>
```

**Nuovo:**
```jsx
<Link to="/carrello" className="..."
      aria-label={t('a11y.cartBadge', { count: cartCount })}>
  <ShoppingCart size={20} aria-hidden="true" />
  {cartCount > 0 && <span className="badge" aria-hidden="true">{cartCount}</span>}
</Link>
```

---

## 3. LoginPage.jsx — Form accessibile

### Fix 3.1 — Label associati agli input (WCAG 1.3.1, 3.3.2)

**Vecchio:**
```jsx
<input type="text" placeholder="Username" value={username} onChange={...} className="input-field" />
```

**Nuovo:**
```jsx
<label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
  {t('login.username')}
</label>
<input
  id="login-username"
  type="text"
  placeholder={t('login.usernamePlaceholder')}
  value={username}
  onChange={...}
  className="input-field"
  autoComplete="username"
  aria-required="true"
  aria-invalid={errors.username ? 'true' : undefined}
  aria-describedby={errors.username ? 'login-username-error' : undefined}
/>
{errors.username && (
  <p id="login-username-error" className="text-red-600 text-sm mt-1" role="alert">
    {errors.username}
  </p>
)}
```

### Fix 3.2 — Bottone show/hide password (WCAG 4.1.2)

**Vecchio:**
```jsx
<button onClick={() => setShowPwd(!showPwd)}>
  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
</button>
```

**Nuovo:**
```jsx
<button
  type="button"
  onClick={() => setShowPwd(!showPwd)}
  aria-label={showPwd ? t('a11y.passwordHide') : t('a11y.passwordShow')}
  className="... focus:outline-none focus:ring-2 focus:ring-primary-500"
>
  {showPwd ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
</button>
```

### Fix 3.3 — Messaggi errore con role="alert" (WCAG 3.3.1)

**Vecchio:**
```jsx
{error && <div className="text-red-600 ...">{error}</div>}
```

**Nuovo:**
```jsx
{error && (
  <div className="text-red-600 ..." role="alert" aria-live="assertive">
    {error}
  </div>
)}
```

---

## 4. CatalogPage.jsx — Tabella e filtri accessibili

### Fix 4.1 — Tabella prodotti con caption e scope (WCAG 1.3.1)

**Vecchio:**
```jsx
<table className="...">
  <thead>
    <tr>
      <th>Codice</th>
      <th>Descrizione</th>
      ...
```

**Nuovo:**
```jsx
<table className="..." aria-label={t('a11y.tableCaption.products')}>
  <thead>
    <tr>
      <th scope="col">{t('catalog.code')}</th>
      <th scope="col">{t('catalog.description')}</th>
      ...
```

### Fix 4.2 — Paginazione accessibile (WCAG 4.1.2)

**Vecchio:**
```jsx
<div className="pagination">
  <button onClick={prevPage}>←</button>
  <span>Pagina {page} di {totalPages}</span>
  <button onClick={nextPage}>→</button>
</div>
```

**Nuovo:**
```jsx
<nav aria-label={t('a11y.pagination', { current: page, total: totalPages })}>
  <button onClick={prevPage} aria-label={t('common.previous')} disabled={page <= 1}>
    <ChevronLeft size={16} aria-hidden="true" />
  </button>
  <span aria-current="page">{t('common.pageOf', { page, total: totalPages })}</span>
  <button onClick={nextPage} aria-label={t('common.next')} disabled={page >= totalPages}>
    <ChevronRight size={16} aria-hidden="true" />
  </button>
</nav>
```

### Fix 4.3 — Loading spinner (WCAG 4.1.2)

**Vecchio:**
```jsx
{loading && <div className="spinner" />}
```

**Nuovo:**
```jsx
{loading && (
  <div className="spinner" role="status" aria-label={t('a11y.loading')}>
    <span className="sr-only">{t('a11y.loading')}</span>
  </div>
)}
```

---

## 5. ConfiguratorPage.jsx — Canvas 3D accessibile

### Fix 5.1 — Sostituire Canvas con Accessible3DCanvas

**Vecchio:**
```jsx
import { Canvas } from '@react-three/fiber';

<div className="canvas-container" style={{ height: 400 }}>
  <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
    <ambientLight intensity={0.6} />
    <directionalLight position={[5, 10, 5]} />
    <OrbitControls />
    <FenceModel config={config} />
  </Canvas>
</div>
```

**Nuovo:**
```jsx
import Accessible3DCanvas from '../components/Accessible3DCanvas';

<Accessible3DCanvas config={config} bom={distintaBase} className="mb-4">
  <ambientLight intensity={0.6} />
  <directionalLight position={[5, 10, 5]} />
  <OrbitControls />
  <FenceModel config={config} />
</Accessible3DCanvas>
```

---

## 6. CartPage.jsx — Tabella carrello accessibile

### Fix 6.1 — Tabella con aria-label e scope (WCAG 1.3.1)

```jsx
<table className="..." aria-label={t('a11y.tableCaption.cart')}>
  <thead>
    <tr>
      <th scope="col">{t('cart.product')}</th>
      <th scope="col">{t('cart.quantity')}</th>
      <th scope="col">{t('cart.unitPrice')}</th>
      <th scope="col">{t('cart.total')}</th>
      <th scope="col"><span className="sr-only">{t('common.actions')}</span></th>
    </tr>
  </thead>
```

### Fix 6.2 — Bottoni azione con aria-label (WCAG 4.1.2)

**Vecchio:**
```jsx
<button onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
```

**Nuovo:**
```jsx
<button
  onClick={() => removeItem(item.id)}
  aria-label={t('cart.removeItem', { name: item.description })}
  className="... focus:outline-none focus:ring-2 focus:ring-primary-500"
>
  <Trash2 size={16} aria-hidden="true" />
</button>
```

---

## 7. QuoteFormPage.jsx — Form preventivo accessibile

### Fix 7.1 — Ogni input con label e aria-describedby (WCAG 1.3.1, 3.3.2)

Stessa logica di Fix 3.1, applicare a tutti i campi del form preventivo:
- Ogni `<input>` deve avere un `<label htmlFor="...">`
- Ogni campo con errore: `aria-invalid="true"` + `aria-describedby="...-error"`
- I messaggi errore devono avere `id` corrispondente e `role="alert"`

### Fix 7.2 — Focus sul primo campo con errore (WCAG 3.3.1)

Dopo la validazione, se ci sono errori:
```jsx
// Dopo setErrors(newErrors):
const firstErrorField = Object.keys(newErrors)[0];
if (firstErrorField) {
  const el = document.getElementById(`quote-${firstErrorField}`);
  if (el) el.focus();
}
```

---

## 8. OrdersPage.jsx — Lista ordini accessibile

### Fix 8.1 — Tabella ordini (WCAG 1.3.1)

```jsx
<table className="..." aria-label={t('a11y.tableCaption.orders')}>
  <thead>
    <tr>
      <th scope="col">{t('orders.number')}</th>
      <th scope="col">{t('orders.date')}</th>
      <th scope="col">{t('orders.status')}</th>
      <th scope="col">{t('orders.total')}</th>
      <th scope="col"><span className="sr-only">{t('common.actions')}</span></th>
    </tr>
  </thead>
```

### Fix 8.2 — Badge stato con testo accessibile (WCAG 1.4.1)

I badge colorati (Preventivo = arancione, Confermato = verde, Inviato = blu) non devono comunicare informazione solo tramite colore:

**Vecchio:**
```jsx
<span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
  {status}
</span>
```

**Nuovo:** (Il testo già esprime lo stato, quindi va bene — verificare solo il contrasto):
```jsx
<span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
  {t(`orders.status.${status}`)}
</span>
```
> Nota: `text-orange-700` (#c2410c) su `bg-orange-100` (#ffedd5) ha contrasto 4.69:1 → OK AA.
> `text-green-700` (#15803d) su `bg-green-100` (#dcfce7) ha contrasto 4.52:1 → OK AA.

---

## 9. PriceListsPage.jsx — Editing inline accessibile

### Fix 9.1 — Input editing con label (WCAG 4.1.2)

**Vecchio:**
```jsx
<input type="number" value={editPrice} onChange={...} className="input-field w-24" />
```

**Nuovo:**
```jsx
<input
  type="number"
  value={editPrice}
  onChange={...}
  className="input-field w-24"
  aria-label={t('priceLists.editPriceFor', { product: row.prdCod })}
  onKeyDown={(e) => {
    if (e.key === 'Enter') savePrice();
    if (e.key === 'Escape') cancelEdit();
  }}
/>
```

---

## 10. admin/UsersPage.jsx — CRUD accessibile

### Fix 10.1 — Tabella utenti (WCAG 1.3.1)

```jsx
<table className="..." aria-label={t('a11y.tableCaption.users')}>
```

### Fix 10.2 — Dialog conferma eliminazione (WCAG 4.1.2)

```jsx
<div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc">
  <h3 id="delete-title">{t('users.confirmDelete')}</h3>
  <p id="delete-desc">{t('a11y.confirmDelete', { name: user.userName })}</p>
  ...
</div>
```

---

## 11. admin/ImportPage.jsx — Dropzone accessibile

### Fix 11.1 — Area drag & drop (WCAG 4.1.2)

**Vecchio:**
```jsx
<div className="dropzone ..." onDragOver={...} onDrop={...}>
  Trascina un file qui
</div>
```

**Nuovo:**
```jsx
<div
  className="dropzone ..."
  onDragOver={...}
  onDrop={...}
  role="button"
  tabIndex={0}
  aria-label={t('a11y.fileDropzone')}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
>
  {t('a11y.fileDropzone')}
  <input ref={fileInputRef} type="file" className="sr-only" onChange={...} aria-label={t('import.selectFile')} />
</div>
```

---

## 12. Modal — Focus Trap (tutte)

### Fix 12.1 — Applicare useFocusTrap a tutti i modal

Per ogni modal (ProductDetailModal, ChangePasswordModal, EuritmoPreviewModal, dialog conferma ordini):

```jsx
import { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

function MyModal({ isOpen, onClose, ... }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {/* ... contenuto ... */}
        <button onClick={onClose} aria-label={t('a11y.closeModal')}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

---

## 13. Icone lucide-react — Regola globale

**Icone decorative** (accanto a testo che ne spiega il significato): aggiungere `aria-hidden="true"`.

```jsx
<button>
  <Save size={16} aria-hidden="true" /> {t('common.save')}
</button>
```

**Icone informative** (senza testo accompagnatorio): aggiungere `aria-label`.

```jsx
<button aria-label={t('common.delete')}>
  <Trash2 size={16} />
</button>
```

---

## Riepilogo contrasti da correggere

| Elemento | Vecchio | Nuovo | Contrasto |
|----------|---------|-------|-----------|
| Testo primario su bianco | `text-primary-600` (#2563eb) | `text-primary-700` (#1d4ed8) | 3.96:1 → 5.56:1 ✅ |
| Placeholder input | `text-gray-400` (#9ca3af) | `text-gray-500` (#6b7280) | 2.48:1 → 4.64:1 ✅ |
| Testo secondario | `text-gray-400` | `text-gray-500` | 2.48:1 → 4.64:1 ✅ |
| Badge orange | `text-orange-700` su `bg-orange-100` | OK così | 4.69:1 ✅ |
| Badge green | `text-green-700` su `bg-green-100` | OK così | 4.52:1 ✅ |
| Badge blue | `text-blue-700` su `bg-blue-100` | OK così | 4.74:1 ✅ |
| Bottone primary (bianco su bg) | `text-white` su `bg-primary-600` | OK così | 4.54:1 ✅ |
