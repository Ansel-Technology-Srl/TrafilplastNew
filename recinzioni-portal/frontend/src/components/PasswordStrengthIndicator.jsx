import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Indicatore visuale della complessità password.
 * Mostra in tempo reale quali regole sono soddisfatte.
 * Corrisponde alle regole definite in AuthService.ValidatePasswordComplexity (AF §4.1)
 */
export default function PasswordStrengthIndicator({ password = '' }) {
  const { t } = useTranslation();

  const rules = useMemo(() => [
    { key: 'minLength',  label: t('auth.ruleMinLength'),  test: password.length >= 8 },
    { key: 'uppercase',  label: t('auth.ruleUppercase'),  test: /[A-Z]/.test(password) },
    { key: 'lowercase',  label: t('auth.ruleLowercase'),  test: /[a-z]/.test(password) },
    { key: 'digit',      label: t('auth.ruleDigit'),      test: /\d/.test(password) },
    { key: 'special',    label: t('auth.ruleSpecial'),     test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ], [password, t]);

  const passedCount = rules.filter(r => r.test).length;
  const strength = passedCount === 0 ? 0 : passedCount <= 2 ? 1 : passedCount <= 4 ? 2 : 3;
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['', 'Debole', 'Media', 'Forte'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra di forza */}
      <div className="flex gap-1">
        {[1, 2, 3].map(level => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              strength >= level ? strengthColors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-xs font-medium ${
          strength === 1 ? 'text-red-600' : strength === 2 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {strengthLabels[strength]}
        </p>
      )}

      {/* Checklist regole */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500">{t('auth.passwordRules')}</p>
        {rules.map(rule => (
          <div key={rule.key} className="flex items-center gap-1.5 text-xs">
            {rule.test ? (
              <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            <span className={rule.test ? 'text-green-700' : 'text-gray-400'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Validazione lato client (corrisponde esattamente alle regole backend)
 */
export function validatePassword(password) {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}
