import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, FolderKanban, CheckSquare, RefreshCw } from 'lucide-react';
import { RoleBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage({ requiredRoles = [], userRole = '' }) {
  const navigate = useNavigate();
  const { currentUser, switchUser, users } = useAuth();

  // Find an authorized user account in the demo if available
  const authorizedUser = users?.find((u) => requiredRoles.includes(u.role));

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          403 Access Restricted
        </span>

        <h1 className="text-xl font-bold text-slate-900 mt-3 mb-2">
          Insufficient Permissions
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          This area is restricted to users with{' '}
          <strong className="text-slate-900">
            {requiredRoles.join(' or ') || 'elevated'}
          </strong>{' '}
          privileges. You are currently signed in as{' '}
          <strong className="text-slate-900">{currentUser?.name}</strong> with the role of:
        </p>

        <div className="inline-flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <RoleBadge role={userRole || currentUser?.role || 'EMPLOYEE'} />
          <span className="text-xs text-slate-600">{currentUser?.email}</span>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Previous Page</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/app/projects"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <Link
              to="/app/tasks"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>My Tasks</span>
            </Link>
          </div>

          {/* Quick Demo Switcher if an authorized account is present */}
          {authorizedUser && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-2">Demo Testing Shortcut:</p>
              <button
                type="button"
                onClick={() => switchUser(authorizedUser.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch to {authorizedUser.name} ({authorizedUser.role})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

