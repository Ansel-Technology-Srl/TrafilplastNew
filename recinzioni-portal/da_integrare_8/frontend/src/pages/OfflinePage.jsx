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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* Icona */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-red-500" aria-hidden="true" />
        </div>

        {/* Titolo */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {t('pwa.offlineTitle')}
        </h1>

        {/* Messaggio */}
        <p className="text-gray-600 mb-2">
          {t('pwa.offlineMessage')}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {t('pwa.offlineLimited')}
        </p>

        {/* Pulsante riprova */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                     font-medium hover:bg-blue-700 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t('pwa.offlineRetry')}
        </button>
      </div>
    </div>
  );
}
