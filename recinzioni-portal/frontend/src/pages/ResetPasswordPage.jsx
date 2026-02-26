import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PasswordStrengthIndicator, { validatePassword } from '../components/PasswordStrengthIndicator';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Valida il token all'apertura della pagina
  useEffect(() => {
    if (!token) {
      setTokenError(t('auth.resetInvalidToken'));
      setValidating(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
        if (res?.success) {
          setTokenValid(true);
        } else {
          setTokenError(res?.message || t('auth.resetInvalidToken'));
        }
      } catch {
        setTokenError(t('auth.resetInvalidToken'));
      } finally {
        setValidating(false);
      }
    })();
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch'));
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMsg(t('auth.passwordRules'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      if (res?.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res?.message || 'Errore durante il reset.');
      }
    } catch {
      setErrorMsg('Errore di connessione al server.');
    } finally {
      setLoading(false);
    }
  };

  // Loading: validazione token in corso
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  // Token non valido / scaduto
  if (!tokenValid && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('auth.resetTitle')}</h2>
            <p className="text-sm text-gray-500 mb-6">{tokenError}</p>
            <Link
              to="/forgot-password"
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
            >
              {t('auth.forgotSend')}
            </Link>
            <div className="mt-4">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                {t('auth.forgotBack')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Successo!
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('auth.resetTitle')}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('auth.resetSuccess')}</p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {t('auth.resetGoToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form reset password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auth.resetSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Nuova password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrorMsg(''); }}
                  className="input-field pr-10"
                  autoComplete="new-password"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            {/* Conferma password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.confirmNewPassword')}
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                className={`input-field ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : ''
                }`}
                autoComplete="new-password"
                disabled={loading}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="mt-1 text-xs text-red-600">{t('auth.passwordMismatch')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !validatePassword(newPassword) || newPassword !== confirmPassword}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? t('app.loading') : t('auth.resetButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
