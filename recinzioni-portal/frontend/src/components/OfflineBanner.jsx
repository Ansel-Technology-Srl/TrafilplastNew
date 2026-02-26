import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Banner slim che appare sotto la topbar quando la connessione cade.
 * Va inserito nel Layout.jsx subito sotto l'header.
 */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{t('pwa.offlineTitle')} — {t('pwa.offlineLimited')}</span>
    </div>
  );
}
