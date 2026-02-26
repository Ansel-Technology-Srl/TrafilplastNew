import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator, { validatePassword } from './PasswordStrengthIndicator';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Modale cambio password dall'interno dell'applicazione (AF §4.1).
 * Richiede: password attuale, nuova password, conferma.
 * Validazione complessità con indicatore visuale.
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const changePassword = useAuthStore(s => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentRef = useRef(null);
  const modalRef = useRef(null);
  useFocusTrap(modalRef, isOpen, onClose);

  // Reset form all'apertura
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setShowCurrent(false);
      setShowNew(false);
      setTimeout(() => currentRef.current?.focus(), 100);
    }
  }, [isOpen]);


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
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      toast.success(t('auth.passwordChanged'));
      onClose();
    } else {
      setErrorMsg(result.message || 'Errore');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modale */}
      <div ref={modalRef} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            {t('auth.changePassword')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            aria-label={t('a11y.closeModal')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Errore */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Password attuale */}
          <div>
            <label htmlFor="currentPwd" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.currentPassword')}
            </label>
            <div className="relative">
              <input
                id="currentPwd"
                ref={currentRef}
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => { setCurrentPassword(e.target.value); setErrorMsg(''); }}
                className="input-field pr-10"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <EyeIcon show={showCurrent} />
              </button>
            </div>
          </div>

          {/* Nuova password */}
          <div>
            <label htmlFor="newPwd" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                id="newPwd"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setErrorMsg(''); }}
                className="input-field pr-10"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <EyeIcon show={showNew} />
              </button>
            </div>
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* Conferma nuova password */}
          <div>
            <label htmlFor="confirmPwd" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.confirmNewPassword')}
            </label>
            <input
              id="confirmPwd"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
              className={`input-field ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : confirmPassword && confirmPassword === newPassword
                    ? 'border-green-300 focus:ring-green-500'
                    : ''
              }`}
              autoComplete="new-password"
              disabled={loading}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-xs text-red-600">{t('auth.passwordMismatch')}</p>
            )}
          </div>

          {/* Bottoni */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !currentPassword || !validatePassword(newPassword) || newPassword !== confirmPassword}
              className="btn-primary flex-1 py-2.5"
            >
              {loading ? t('app.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
