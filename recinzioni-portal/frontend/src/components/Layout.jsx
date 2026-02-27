import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useCartStore } from '../store/store';
import { Package, Wrench, ShoppingCart, FileText, Users, Upload, Tag, LogOut, Globe, Menu, X, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import ChangePasswordModal from './ChangePasswordModal';
import InstallPrompt from './InstallPrompt';
import UpdatePrompt from './UpdatePrompt';
import OfflineBanner from './OfflineBanner';

const LANGS = [
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' }
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore(s => s.getItemCount());
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Controlla aggiornamenti service worker ad ogni cambio pagina
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
      });
    }
  }, [location.pathname]);

  const navItems = [];
  if (user?.userType === 1) {
    navItems.push({ to: '/admin/utenti', icon: Users, label: t('nav.users') });
    navItems.push({ to: '/admin/import', icon: Upload, label: t('nav.import') });
  }
  if (user?.userType === 2) {
    navItems.push({ to: '/listini', icon: Tag, label: t('nav.priceLists') });
  }
  if (user?.userType === 3 || user?.userType === 4) {
    navItems.push({ to: '/catalogo', icon: Package, label: t('nav.catalog') });
    navItems.push({ to: '/configuratore', icon: Wrench, label: t('nav.configurator') });
    navItems.push({ to: '/carrello', icon: ShoppingCart, label: t('nav.cart'), badge: cartCount });
    navItems.push({ to: '/ordini', icon: FileText, label: t('nav.orders') });
  }

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden">
      <UpdatePrompt />
      {/* Mobile header */}
      <div className="md:hidden bg-gray-800 text-white p-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">{t('app.title')}</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? t('a11y.menuClose') : t('a11y.menuOpen')}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Sidebar — sticky su desktop con footer sempre visibile */}
      <aside className={`sidebar ${menuOpen ? 'block' : 'hidden'} md:flex md:flex-col w-full md:w-64 bg-gray-800 text-white flex-shrink-0`}>
        {/* Header sidebar desktop */}
        <div className="hidden md:block p-6 border-b border-gray-600">
          <h1 className="font-bold text-xl text-primary-300">{t('app.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.userName}</p>
          <p className="text-xs text-gray-500">{t(`users.types.${user?.userType}`)}</p>
        </div>

        {/* Navigation */}
        <nav id="main-nav" aria-label={t('nav.main', 'Navigazione principale')} className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-2 py-0.5" aria-label={t('a11y.cartBadge', { count: item.badge })}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar: lingua, cambio password, logout — sempre visibile */}
        <div className="p-4 border-t border-gray-600 space-y-1 flex-shrink-0">
          {/* Language selector */}
          <div className="lang-selector flex items-center gap-2 mb-3 px-3" role="group" aria-label={t('a11y.selectLanguage')}>
            <Globe size={16} className="text-gray-400" aria-hidden="true" />
            <div className="flex gap-1">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => i18n.changeLanguage(l.code)}
                  className={`px-2 py-1 text-xs rounded ${
                    i18n.language === l.code
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cambio Password */}
          <button
            onClick={() => { setShowChangePwd(true); setMenuOpen(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white w-full transition-colors"
          >
            <KeyRound size={20} />
            <span>{t('nav.changePassword')}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white w-full transition-colors"
          >
            <LogOut size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Offline banner */}
      <OfflineBanner />

      {/* Main content */}
      <main id="main-content" className="flex-1 p-4 md:p-8 overflow-auto bg-[#f5f5f5]">
        <Outlet />
      </main>

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* Modale cambio password */}
      <ChangePasswordModal isOpen={showChangePwd} onClose={() => setShowChangePwd(false)} />
    </div>
  );
}
