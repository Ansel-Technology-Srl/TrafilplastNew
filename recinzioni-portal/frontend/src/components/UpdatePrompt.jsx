import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, X } from 'lucide-react';

/**
 * Banner che appare quando il service worker rileva un nuovo build.
 * Ascolta l'evento custom 'pwa-update-available' dispatched da main.jsx.
 */
export default function UpdatePrompt() {
  const { t } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = () => setShowPrompt(true);
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  const handleUpdate = useCallback(() => {
    // Chiama la funzione di aggiornamento registrata in main.jsx
    if (window.__PWA_UPDATE_SW) {
      window.__PWA_UPDATE_SW(true);
    }
    // Fallback: ricarica la pagina
    setTimeout(() => window.location.reload(), 500);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  if (!showPrompt) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin-slow" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">{t('pwa.updateAvailable')}</p>
            <p className="text-xs text-amber-100 truncate">{t('pwa.updateMessage')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="px-4 py-1.5 bg-white text-amber-600 rounded-md text-sm font-medium
                       hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-white
                       focus:ring-offset-2 focus:ring-offset-amber-500 transition-colors"
          >
            {t('pwa.updateButton')}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md hover:bg-amber-400 focus:outline-none focus:ring-2
                       focus:ring-white transition-colors"
            aria-label={t('pwa.updateDismiss')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
