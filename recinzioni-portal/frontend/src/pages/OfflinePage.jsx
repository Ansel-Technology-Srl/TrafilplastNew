import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Pagina offline mostrata quando l'utente tenta di accedere a una risorsa
 * non disponibile in cache. Registrata nel routing come fallback.
 */
export default function OfflinePage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        {/* Icona */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>

        {/* Titolo */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('pwa.offlineTitle')}
        </h1>

        {/* Messaggio */}
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {t('pwa.offlineMessage')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('pwa.offlineLimited')}
        </p>

        {/* Pulsante riprova */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg
                     font-medium hover:bg-primary-700 focus:outline-none focus:ring-2
                     focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t('pwa.offlineRetry')}
        </button>
      </div>
    </div>
  );
}
