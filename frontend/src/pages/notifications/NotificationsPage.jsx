import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Inbox,
  UserCheck,
  MessageSquare,
  Calendar,
  Layers,
} from 'lucide-react';
import NotificationItem from '../../components/notifications/NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Alerts' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'TASK_ASSIGNED', label: 'Assignments' },
  { id: 'COMMENT_ADDED', label: 'Comments' },
  { id: 'TASK_OVERDUE', label: 'Overdue Alerts' },
  { id: 'STATUS_CHANGED', label: 'Status Updates' },
];

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    loading,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const overdueAlertsCount = useMemo(
    () => notifications.filter((n) => n.type === 'TASK_OVERDUE').length,
    [notifications]
  );
  const assignmentCount = useMemo(
    () => notifications.filter((n) => n.type === 'TASK_ASSIGNED').length,
    [notifications]
  );
  const commentCount = useMemo(
    () => notifications.filter((n) => n.type === 'COMMENT_ADDED').length,
    [notifications]
  );

  // Filtered list
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeTab === 'UNREAD') {
      result = result.filter((n) => !n.isRead);
    } else if (activeTab !== 'ALL') {
      result = result.filter((n) => n.type === activeTab);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q))
      );
    }

    return result;
  }, [notifications, activeTab, searchTerm]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time collaboration alerts, task assignments, and overdue warnings for {currentUser?.name}.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshNotifications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Alerts</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{notifications.length}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unread</span>
            <div className="w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-700">{unreadCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-rose-700">{overdueAlertsCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comments</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-700">{commentCount}</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-blue-600"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `No notifications matching "${searchTerm}". Try resetting your search filter.`
                : activeTab === 'UNREAD'
                ? "You're all caught up! There are no unread notifications right now."
                : 'No alerts found in this category.'}
            </p>
            {(searchTerm || activeTab !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('ALL');
                }}
                className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 p-2 space-y-1">
            {filteredNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

