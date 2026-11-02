import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, Inbox } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const displayedNotifications =
    filter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 flex flex-col max-h-[520px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      role="region"
      aria-label="Notification Center"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 pt-2 pb-1 border-b border-slate-100 gap-1 bg-white text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            filter === 'UNREAD'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {displayedNotifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter === 'UNREAD'
                ? "You're all caught up with your tasks and mentions."
                : 'Task assignments and activity alerts will appear here.'}
            </p>
          </div>
        ) : (
          displayedNotifications.slice(0, 15).map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onCloseDropdown={onClose}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 text-center">
        <Link
          to="/app/notifications"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>View all in Notification Center</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

