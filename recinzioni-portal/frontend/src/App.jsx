import { useEffect, Suspense, lazy, Component } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/store';
import Layout from './components/Layout';
import SkipLinks from './components/SkipLinks';

// ─── Error Boundary per chunk loading falliti ───────────────────────
// Quando il Service Worker serve chunk JS obsoleti, il lazy import fallisce.
// Questo boundary intercetta l'errore e forza un reload dalla rete.
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    // Rileva errori di caricamento chunk (nomi variano per browser)
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed')
    ) {
      return { hasError: true };
    }
    throw error; // Non è un errore di chunk, ri-lancia
  }
  componentDidCatch() {
    // Evita loop infiniti: se abbiamo già provato a ricaricare, non riprovare
    const reloadKey = 'chunk_reload_ts';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (lastReload && now - Number(lastReload) < 10000) {
      return; // Già ricaricato negli ultimi 10 secondi, non riprovare
    }
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
  render() {
    if (this.state.hasError) return null; // Momentaneamente vuoto durante il reload
    return this.props.children;
  }
}

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ConfiguratorPage = lazy(() => import('./pages/ConfiguratorPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const QuoteFormPage = lazy(() => import('./pages/QuoteFormPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const ImportPage = lazy(() => import('./pages/admin/ImportPage'));
const PriceListsPage = lazy(() => import('./pages/PriceListsPage'));
const OfflinePage = lazy(() => import('./pages/OfflinePage'));

function ProtectedRoute({ allowedTypes }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedTypes && !allowedTypes.includes(user?.userType)) return <Navigate to="/" />;
  return <Layout />;
}

function HomeRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (user.userType === 1) return <Navigate to="/admin/utenti" />;
  if (user.userType === 2) return <Navigate to="/listini" />;
  return <Navigate to="/catalogo" />;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <svg className="animate-spin h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

export default function App() {
  const { checkAuth, loading } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => { checkAuth(); }, []);

  // Sync <html lang> attribute with current language (WCAG 3.1.1)
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (loading) return <Spinner />;

  return (
    <>
      <SkipLinks />
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '12px', fontSize: '14px' }
      }} />
      <ChunkErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* ===== Auth routes (pubbliche) ===== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ===== Home redirect per tipo utente ===== */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ===== Admin (tipo 1) ===== */}
          <Route element={<ProtectedRoute allowedTypes={[1]} />}>
            <Route path="/admin/utenti" element={<UsersPage />} />
            <Route path="/admin/import" element={<ImportPage />} />
          </Route>

          {/* ===== Super User (tipo 2) ===== */}
          <Route element={<ProtectedRoute allowedTypes={[2]} />}>
            <Route path="/listini" element={<PriceListsPage />} />
          </Route>

          {/* ===== Capo Negozio (3) & Operatore (4) ===== */}
          <Route element={<ProtectedRoute allowedTypes={[3, 4]} />}>
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/configuratore" element={<ConfiguratorPage />} />
            <Route path="/carrello" element={<CartPage />} />
            <Route path="/preventivo" element={<QuoteFormPage />} />
            <Route path="/ordini" element={<OrdersPage />} />
          </Route>

          {/* ===== Offline ===== */}
          <Route path="/offline" element={<OfflinePage />} />

          {/* ===== Catch-all ===== */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
    </>
  );
}
