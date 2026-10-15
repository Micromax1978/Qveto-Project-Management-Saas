import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import Logo from './Logo';

export default function ActionModal({ isOpen, onClose, title, actionType = 'signup' }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-left transition-all transform scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <Logo size="sm" showWordmark={false} />
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-slate-900">
              {title || (actionType === 'login' ? 'Log in to TASKORA' : 'Get Started with TASKORA')}
            </h3>
            <p className="text-xs text-slate-500">Plan Better. Work Smarter. Achieve More.</p>
          </div>
        </div>

        {/* Informative message */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-900">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-950 mb-1">
                {actionType === 'login' ? 'Authentication Preview' : 'Interactive Prototype Preview'}
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                You are currently exploring the <strong>TASKORA Frontend Foundation</strong>. Real-time workspace synchronization and database authentication will be connected in Phase 2.
              </p>
            </div>
          </div>
        </div>

        {/* Simulated quick email form preview */}
        <div className="space-y-3.5 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <input
              type="email"
              readOnly
              value="developer@taskora.io"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-hidden cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Workspace Role
            </label>
            <input
              type="text"
              readOnly
              value="Project Lead / Full-Stack Engineer"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-hidden cursor-not-allowed"
            />
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span>Continue Exploring Landing Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
