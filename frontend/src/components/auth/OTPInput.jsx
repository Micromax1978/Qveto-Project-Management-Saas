import React, { useRef, useEffect } from 'react';

/**
 * Polished Six-Digit OTP Input Component
 * Features:
 * - Exactly 6 numeric digits
 * - Auto-advance focus on typing
 * - Backspace navigates to previous input
 * - Arrow key navigation (Left/Right)
 * - Full 6-digit paste support (sanitizes non-digits)
 * - Numeric-only input restriction
 * - Responsive sizing (fits 375px screens without horizontal overflow)
 * - Accessible grouping and labeling
 */
export default function OTPInput({
  value = '',
  onChange,
  disabled = false,
  error = '',
  idPrefix = 'taskora-otp',
}) {
  const digits = Array(6)
    .fill('')
    .map((_, i) => (value && value[i] ? value[i] : ''));

  const inputRefs = useRef([]);

  // Auto-focus first input on mount if not disabled
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    // Extract only digits
    const numericVal = rawVal.replace(/\D/g, '');

    if (!numericVal) {
      // User cleared the box
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    // If multiple characters entered (e.g. autofill or fast typing)
    if (numericVal.length > 1) {
      handlePastedContent(numericVal, index);
      return;
    }

    // Single digit entered
    const singleDigit = numericVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    const nextOtp = newDigits.join('');
    onChange(nextOtp);

    // Auto-advance to next box if not on the last box
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
      inputRefs.current[index + 1].select();
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!digits[index]) {
        // Current box is empty, move focus to previous box and clear it
        if (index > 0 && inputRefs.current[index - 1]) {
          e.preventDefault();
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
          inputRefs.current[index - 1].focus();
        }
      } else {
        // Current box has a digit, clear it
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0 && inputRefs.current[index - 1]) {
        e.preventDefault();
        inputRefs.current[index - 1].focus();
        inputRefs.current[index - 1].select();
      }
    } else if (e.key === 'ArrowRight') {
      if (index < 5 && inputRefs.current[index + 1]) {
        e.preventDefault();
        inputRefs.current[index + 1].focus();
        inputRefs.current[index + 1].select();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
    }
  };

  const handlePastedContent = (pastedText, startIndex = 0) => {
    const cleaned = pastedText.replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;

    const newDigits = [...digits];
    // If user pastes a full 6-digit code or partial code
    for (let i = 0; i < cleaned.length; i++) {
      const targetPos = (cleaned.length === 6 ? 0 : startIndex) + i;
      if (targetPos < 6) {
        newDigits[targetPos] = cleaned[i];
      }
    }

    const nextOtp = newDigits.join('');
    onChange(nextOtp);

    // Focus the box following the last pasted digit, or the last box
    const focusTarget = Math.min(
      (cleaned.length === 6 ? 0 : startIndex) + cleaned.length,
      5
    );
    if (inputRefs.current[focusTarget]) {
      inputRefs.current[focusTarget].focus();
      inputRefs.current[focusTarget].select();
    }
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    if (disabled) return;
    const pastedData = e.clipboardData.getData('text');
    handlePastedContent(pastedData, index);
  };

  return (
    <div className="w-full">
      <fieldset
        role="group"
        aria-label="Six-digit verification code"
        className="border-0 p-0 m-0"
      >
        <legend className="sr-only">Enter six-digit email verification code</legend>

        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-sm mx-auto">
          {digits.map((digit, index) => {
            const inputId = `${idPrefix}-${index}`;
            const isFilled = Boolean(digit);

            return (
              <div key={inputId} className="flex-1 min-w-0 max-w-[52px]">
                <input
                  ref={(el) => (inputRefs.current[index] = el)}
                  id={inputId}
                  name={`${idPrefix}-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={2}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e, index)}
                  onFocus={(e) => e.target.select()}
                  disabled={disabled}
                  aria-label={`Digit ${index + 1} of 6`}
                  aria-invalid={Boolean(error)}
                  className={`w-full aspect-square text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 outline-hidden select-all ${
                    error
                      ? 'border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : isFilled
                      ? 'border-blue-500 bg-blue-50/30 text-slate-900 shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                  } ${
                    disabled
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                      : ''
                  }`}
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-center text-xs font-medium text-red-600 mt-2.5 animate-in fade-in duration-150"
        >
          {error}
        </p>
      )}
    </div>
  );
}
