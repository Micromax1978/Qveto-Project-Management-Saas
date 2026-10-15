import React from 'react';
import { Check, X } from 'lucide-react';

function calculatePasswordStrength(password = '') {
  if (!password) {
    return {
      score: 0,
      label: '',
      colorClass: 'bg-slate-200',
      textColor: 'text-slate-400',
      checks: {
        length: false,
        mixedCase: false,
        number: false,
        special: false,
      },
    };
  }

  const checks = {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  let metCount = 0;
  if (checks.length) metCount += 1;
  if (checks.mixedCase) metCount += 1;
  if (checks.number) metCount += 1;
  if (checks.special) metCount += 1;

  // If under 8 chars, never higher than weak (score 1)
  let score = 0;
  let label = 'Too short';
  let colorClass = 'bg-red-500';
  let textColor = 'text-red-600';

  if (!checks.length) {
    score = 1;
    label = 'Weak (minimum 8 characters)';
    colorClass = 'bg-red-500';
    textColor = 'text-red-600';
  } else if (metCount === 1) {
    score = 1;
    label = 'Weak';
    colorClass = 'bg-red-500';
    textColor = 'text-red-600';
  } else if (metCount === 2) {
    score = 2;
    label = 'Fair';
    colorClass = 'bg-amber-500';
    textColor = 'text-amber-600';
  } else if (metCount === 3) {
    score = 3;
    label = 'Good';
    colorClass = 'bg-blue-600';
    textColor = 'text-blue-600';
  } else if (metCount === 4) {
    score = 4;
    label = 'Strong';
    colorClass = 'bg-emerald-600';
    textColor = 'text-emerald-600';
  }

  return {
    score,
    label,
    colorClass,
    textColor,
    checks,
  };
}

export default function PasswordStrengthMeter({ password = '', showChecks = true }) {
  if (!password) {
    return (
      <p className="text-xs text-slate-500 mt-1.5">
        Use at least 8 characters with a mix of letters, numbers, and symbols.
      </p>
    );
  }

  const { score, label, colorClass, textColor, checks } = calculatePasswordStrength(password);

  return (
    <div className="mt-2 space-y-2 select-none" aria-live="polite">
      {/* 4-segment visual indicator */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Strength:</span>
        <span className={`font-semibold ${textColor}`}>{label}</span>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Password strength is ${label}`}
      >
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? colorClass : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? colorClass : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? colorClass : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 4 ? colorClass : 'bg-transparent'}`} />
      </div>

      {showChecks && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            {checks.length ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            )}
            <span className={checks.length ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              8+ characters
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {checks.mixedCase ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            )}
            <span className={checks.mixedCase ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              Upper & lower case
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {checks.number ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            )}
            <span className={checks.number ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              At least 1 number
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {checks.special ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            )}
            <span className={checks.special ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              At least 1 symbol
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
