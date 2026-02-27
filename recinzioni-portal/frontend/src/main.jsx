import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

// ─── Registrazione Service Worker PWA ───────────────────────────────
// Auto-aggiornamento: quando viene rilevato un nuovo build,
// il service worker si aggiorna e la pagina si ricarica automaticamente.
const updateSW = registerSW({
  onNeedRefresh() {
    // Aggiorna immediatamente senza chiedere all'utente
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App pronta per uso offline');
  },
  onRegisteredSW(swUrl, registration) {
    // Check periodico aggiornamenti ogni 15 minuti
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 15 * 60 * 1000);
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
