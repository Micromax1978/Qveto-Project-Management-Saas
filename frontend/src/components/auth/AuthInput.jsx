import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AuthInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoComplete,
  required = false,
  disabled = false,
  icon: Icon,
  helperText,
  className = '',
}) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-800 select-none"
        >
          {label}
          {required && <span className="text-blue-600 ml-1" aria-hidden="true">*</span>}
        </label>
        {required && (
          <span className="sr-only">required</span>
        )}
      </div>

      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`w-full h-12 text-sm text-slate-900 placeholder:text-slate-400 bg-white border rounded-lg transition-all duration-150 outline-hidden ${
            Icon ? 'pl-11' : 'pl-3.5'
          } pr-3.5 ${
            error
              ? 'border-red-500 ring-1 ring-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
          } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
        />
      </div>

      {/* Inline error or helper text */}
      {error ? (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-600 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
