import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

// ─── Registrazione Service Worker PWA ───────────────────────────────
// skipWaiting + clientsClaim sono nel workbox config (vite.config.js),
// quindi il nuovo SW si attiva subito senza attendere reload.
const updateSW = registerSW({
  onNeedRefresh() {
    // Il SW è già configurato con skipWaiting, ma per sicurezza
    // forza anche qui l'aggiornamento immediato
    updateSW(true);
  },
  onOfflineReady() {
    // App pronta per uso offline
  },
  onRegisteredSW(swUrl, registration) {
    // Check aggiornamenti ogni 5 minuti (ridotto da 15)
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Errore registrazione SW:', error);
  }
});

// Salva la funzione di aggiornamento globalmente
window.__PWA_UPDATE_SW = updateSW;

// ─── Render App ─────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
