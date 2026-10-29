import React from 'react';
import { Info, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AuthInfoNotice({
  mode = 'login',
  onReset,
  className = '',
}) {
  const isLogin = mode === 'login';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <Info className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Frontend Validation Passed
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              Demo Phase
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {isLogin
              ? 'Your email and password met all frontend input rules. Backend authentication services (FastAPI & secure JWT handling) will be integrated in Phase 2.'
              : 'Your full name, work email, and password strength requirements were successfully verified. Real account creation and workspace provisioning will occur once backend services are connected.'}
          </p>

          <div className="mt-3 p-2.5 rounded-lg bg-white/80 border border-blue-100 flex items-start gap-2 text-[11px] text-slate-600">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Security note:</strong> No credentials were sent over the network, stored in browser cookies, or saved to localStorage.
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <a
              href="/app/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <span>Enter Taskora Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 hover:bg-white transition-colors"
              >
                <span>Test form again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
