/**
 * SkipLinks — Barra di skip links accessibili (WCAG 2.4.1).
 *
 * Visivamente nascosta ma raggiungibile con Tab.
 * Al focus diventa visibile con stile alto contrasto.
 *
 * INSERIRE in App.jsx PRIMA di tutto il resto:
 *   import SkipLinks from './components/SkipLinks';
 *   function App() {
 *     return (
 *       <>
 *         <SkipLinks />
 *         <BrowserRouter>...</BrowserRouter>
 *       </>
 *     );
 *   }
 *
 * PREREQUISITI nel Layout.jsx:
 *   - <nav id="main-nav" ...> attorno alla sidebar
 *   - <main id="main-content" ...> attorno al children
 */
import { useTranslation } from 'react-i18next';

export default function SkipLinks() {
  const { t } = useTranslation();

  const linkClasses = [
    'absolute left-0 top-0 z-[9999]',
    'bg-primary-700 text-white',
    'px-4 py-2 text-sm font-medium',
    'transform -translate-y-full',
    'focus:translate-y-0',
    'transition-transform duration-200',
    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700',
    'rounded-br-md',
  ].join(' ');

  return (
    <nav aria-label={t('a11y.skipToContent', 'Vai al contenuto principale')} className="sr-only focus-within:not-sr-only">
      <a href="#main-content" className={linkClasses}>
        {t('a11y.skipToContent', 'Vai al contenuto principale')}
      </a>
      <a href="#main-nav" className={`${linkClasses} left-[220px]`}>
        {t('a11y.skipToNav', 'Vai alla navigazione')}
      </a>
    </nav>
  );
}
