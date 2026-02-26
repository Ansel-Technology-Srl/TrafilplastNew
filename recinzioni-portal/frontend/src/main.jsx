import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

// ─── Registrazione Service Worker PWA ───────────────────────────────
// L'evento 'pwa-update-available' viene ascoltato da UpdatePrompt.jsx
// L'evento 'pwa-offline-ready' viene loggato in console
const updateSW = registerSW({
  onNeedRefresh() {
    // Dispatch evento custom per notificare UpdatePrompt
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  onOfflineReady() {
    console.log('[PWA] App pronta per uso offline');
  },
  onRegisteredSW(swUrl, registration) {
    // Check periodico aggiornamenti ogni 60 minuti
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Errore registrazione SW:', error);
  }
});

// Salva la funzione di aggiornamento globalmente per UpdatePrompt
window.__PWA_UPDATE_SW = updateSW;

// ─── Render App ─────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
