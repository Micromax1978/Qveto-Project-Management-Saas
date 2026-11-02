import React, { useState, useEffect, useCallback } from 'react';
import { History, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ActivityItem from './ActivityItem';
import { activityService } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';

export default function ActivityTimeline({ taskId, refreshTrigger = 0 }) {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivities = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getActivities(taskId, currentUser);
      setActivities(data);
    } catch (err) {
      setError(err.message || 'Failed to load task activity');
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshTrigger]);

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Activity History & Audit
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {activities.length} Events
          </span>
          <button
            type="button"
            onClick={loadActivities}
            disabled={loading}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Refresh timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading activity stream...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <History className="w-7 h-7 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No activity recorded yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Changes to task status, assignments, comments, and attachments will be tracked here.
          </p>
        </div>
      ) : (
        /* Chronological Event Stream */
        <div className="relative pl-1 pt-2">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

