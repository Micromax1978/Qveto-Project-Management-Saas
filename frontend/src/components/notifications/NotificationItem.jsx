import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  MessageSquare,
  Calendar,
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
} from 'lucide-react';
import { NOTIFICATION_CONFIG } from '../../constants/collaboration';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';

function getCategoryIcon(type) {
  switch (type) {
    case 'TASK_ASSIGNED':
      return { icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    case 'COMMENT_ADDED':
      return { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
    case 'DUE_DATE_CHANGED':
      return { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    case 'TASK_OVERDUE':
      return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
    case 'STATUS_CHANGED':
      return { icon: ArrowRight, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    default:
      return { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  }
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onCloseDropdown,
}) {
  const navigate = useNavigate();
  const { icon: Icon, color, bg } = getCategoryIcon(notification.type);

  const handleClick = (e) => {
    // If not read, mark as read
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    if (onCloseDropdown) onCloseDropdown();

    // Navigate to target task or project
    if (notification.projectId) {
      navigate(`/app/projects/${notification.projectId}?tab=board&taskId=${notification.taskId || ''}`);
    } else if (notification.taskId) {
      navigate(`/app/tasks?taskId=${notification.taskId}`);
    }
  };

  const handleMarkReadClick = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border ${
        notification.isRead
          ? 'bg-white border-transparent hover:bg-slate-50/80 hover:border-slate-200/60'
          : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70'
      }`}
    >
      {/* Category Icon */}
      <div
        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${bg} ${color}`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p
            className={`text-xs truncate ${
              notification.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
            }`}
          >
            {notification.title}
          </p>

          <span
            className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap"
            title={formatDateTime(notification.createdAt)}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {/* Unread indicator / mark read action */}
      <div className="flex items-center gap-1 shrink-0 mt-1">
        {!notification.isRead ? (
          <button
            type="button"
            onClick={handleMarkReadClick}
            className="w-2.5 h-2.5 rounded-full bg-blue-600 hover:scale-125 transition-transform"
            title="Mark as read"
            aria-label="Mark as read"
          />
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

