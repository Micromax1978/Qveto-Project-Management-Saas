import React from 'react';
import {
  PlusCircle,
  ArrowRight,
  Flag,
  UserCheck,
  Calendar,
  CheckSquare,
  ListPlus,
  MessageSquare,
  Edit2,
  Trash2,
  Paperclip,
  Activity,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import { ACTIVITY_TYPE_CONFIG } from '../../constants/collaboration';

function getActivityIcon(type) {
  switch (type) {
    case 'TASK_CREATED':
      return { icon: PlusCircle, bg: 'bg-emerald-500', text: 'text-white' };
    case 'STATUS_CHANGED':
      return { icon: ArrowRight, bg: 'bg-blue-500', text: 'text-white' };
    case 'PRIORITY_CHANGED':
      return { icon: Flag, bg: 'bg-amber-500', text: 'text-white' };
    case 'ASSIGNEE_CHANGED':
      return { icon: UserCheck, bg: 'bg-indigo-500', text: 'text-white' };
    case 'DUE_DATE_CHANGED':
      return { icon: Calendar, bg: 'bg-purple-500', text: 'text-white' };
    case 'SUBTASK_TOGGLED':
      return { icon: CheckSquare, bg: 'bg-slate-700', text: 'text-white' };
    case 'SUBTASK_ADDED':
      return { icon: ListPlus, bg: 'bg-slate-600', text: 'text-white' };
    case 'COMMENT_ADDED':
      return { icon: MessageSquare, bg: 'bg-sky-500', text: 'text-white' };
    case 'COMMENT_EDITED':
      return { icon: Edit2, bg: 'bg-slate-500', text: 'text-white' };
    case 'COMMENT_DELETED':
      return { icon: Trash2, bg: 'bg-rose-500', text: 'text-white' };
    case 'ATTACHMENT_UPLOADED':
      return { icon: Paperclip, bg: 'bg-teal-500', text: 'text-white' };
    case 'ATTACHMENT_DELETED':
      return { icon: Trash2, bg: 'bg-rose-500', text: 'text-white' };
    default:
      return { icon: Activity, bg: 'bg-slate-500', text: 'text-white' };
  }
}

export default function ActivityItem({ activity, isLast = false }) {
  const { icon: Icon, bg, text } = getActivityIcon(activity.type);
  const config = ACTIVITY_TYPE_CONFIG[activity.type];

  return (
    <div className="relative flex gap-3 pb-5">
      {/* Vertical connecting line */}
      {!isLast && (
        <span
          className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-slate-200"
          aria-hidden="true"
        />
      )}

      {/* Node icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white shadow-2xs z-10 ${bg} ${text}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Activity Details */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <Avatar user={activity.user} size="xs" showTooltip={false} />
          <span className="font-bold text-slate-900 truncate">
            {activity.user?.name || 'Team Member'}
          </span>
          <span className="text-slate-600 font-normal">
            {activity.description}
          </span>
        </div>

        {/* Timestamp */}
        <p
          className="text-[11px] text-slate-400 mt-1"
          title={formatDateTime(activity.createdAt)}
        >
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

