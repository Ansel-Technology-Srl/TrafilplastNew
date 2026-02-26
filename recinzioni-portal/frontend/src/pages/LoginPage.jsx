import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const usernameRef = useRef(null);

  // Se già autenticato, redirect alla home
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Focus iniziale sul campo username
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg(t('auth.loginError'));
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password, rememberMe);
    setLoading(false);

    if (result.success) {
      toast.success(t('common.success'));
      // La navigazione avviene automaticamente tramite l'useEffect su isAuthenticated
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Language selector in alto a destra */}
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              title={lang.name}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                i18n.language === lang.code
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenuto centrato */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px]">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-600/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Card login */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Messaggio di errore */}
            {errorMsg && (
              <div
                className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                role="alert"
              >
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                    </svg>
                  </span>
                  <input
                    id="username"
                    ref={usernameRef}
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setErrorMsg(''); }}
                    className="input-field pl-10"
                    placeholder={t('auth.username')}
                    autoComplete="username"
                    aria-required="true"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                    className="input-field pl-10 pr-10"
                    placeholder={t('auth.password')}
                    autoComplete="current-password"
                    aria-required="true"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-600">{t('auth.rememberMe')}</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                  tabIndex={loading ? -1 : 0}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Bottone login */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{t('app.loading')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span>{t('auth.login')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} &mdash; {t('app.title')}
          </p>
        </div>
      </div>
    </div>
  );
}
