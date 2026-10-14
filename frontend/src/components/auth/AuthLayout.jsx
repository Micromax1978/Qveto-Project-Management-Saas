import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, LifeBuoy } from 'lucide-react';
import Logo from '../Logo';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuthLayout({
  children,
  maxWidth = 'max-w-md',
  badgeText,
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Back to Home',
  showFooterLinks = true,
  className = '',
}) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Accent: Subtle ambient glow & grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Top Application Header */}
      <header className="relative z-10 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg p-1 -m-1 transition-transform hover:opacity-95"
            aria-label="TASKORA - Home"
          >
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
              <Lock className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>256-bit Encrypted Session</span>
            </div>

            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg px-2.5 py-1.5 hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className={`w-full ${maxWidth} mx-auto transition-all duration-200 ${className}`}>
          {/* Optional Top Context Pill & Title Section */}
          {(title || badgeText) && (
            <div className="text-center mb-8">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 mb-3 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                  {badgeText}
                </div>
              )}
              {title && (
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Card Wrapper */}
          {children}
        </div>
      </main>

      {/* Clean Global Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/60 bg-white/60 backdrop-blur-xs py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {CURRENT_YEAR} TASKORA Inc.</span>
            <span className="text-slate-300">•</span>
            <span>All rights reserved.</span>
          </div>

          {showFooterLinks && (
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-default">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Enterprise Security</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-default">
                <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
                <span>Support Center</span>
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
