import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DataSyncStatus({ onRefresh, isRefreshing = false, lastUpdated = new Date() }) {
  const [justRefreshed, setJustRefreshed] = useState(false);

  const handleManualRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium text-slate-500">
          {justRefreshed ? 'Synced' : 'Live'}
        </span>
      </span>

      <span className="text-slate-300">•</span>

      <span className="text-[11px] text-slate-400">
        Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
      </span>

      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        title="Check for concurrent updates & refresh data"
        className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/70 transition-colors disabled:opacity-50"
        aria-label="Refresh data"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
      </button>
    </div>
  );
}
