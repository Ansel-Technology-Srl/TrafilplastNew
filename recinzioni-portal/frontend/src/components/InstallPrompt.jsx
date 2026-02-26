import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

/**
 * Banner per suggerire l'installazione della PWA.
 * Intercetta l'evento beforeinstallprompt del browser.
 * Se l'utente clicca "Non ora", non mostra per 7 giorni.
 */
export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Controlla se è stato già dismissato di recente
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const diffDays = (now - dismissedDate) / (1000 * 60 * 60 * 24);
      if (diffDays < DISMISS_DAYS) return;
    }

    const handler = (e) => {
      // Impedisce al browser di mostrare il suo prompt nativo
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Se l'app è già installata, non mostrare
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg
                 transform transition-transform duration-300 ease-out"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <Download className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">{t('pwa.installTitle')}</p>
            <p className="text-xs text-blue-100 truncate">{t('pwa.installMessage')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 bg-white text-blue-600 rounded-md text-sm font-medium
                       hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white
                       focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
          >
            {t('pwa.installButton')}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2
                       focus:ring-white transition-colors"
            aria-label={t('pwa.dismissButton')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
