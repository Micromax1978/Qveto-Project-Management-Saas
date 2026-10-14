import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthSubmitButton({
  children,
  loading = false,
  loadingText,
  disabled = false,
  onClick,
  type = 'submit',
  className = '',
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full h-12 flex items-center justify-center gap-2.5 px-6 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm shadow-blue-500/15 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          <span>{loadingText || 'Please wait...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
