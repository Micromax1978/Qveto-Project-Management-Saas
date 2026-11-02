import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Loader2, MoreHorizontal } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

export default function CommentItem({
  comment,
  onUpdate,
  onDelete,
}) {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isAuthor = currentUser?.id === comment.userId;
  const canEdit = Permissions.canEditComment(currentUser?.role, comment.userId, currentUser?.id);
  const canDelete = Permissions.canDeleteComment(currentUser?.role, comment.userId, currentUser?.id);

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSubmittingEdit) return;
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } catch (err) {
      // Error handled by parent toast
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="group relative flex gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors">
      <Avatar user={comment.user} size="sm" showTooltip={false} />

      <div className="flex-1 min-w-0">
        {/* Comment Header: Author Name, Role, Timestamp, Edited, Controls */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate">
              {comment.user?.name || 'Team Member'}
            </span>
            {comment.user?.role && (
              <span className="text-[10px] text-slate-500 font-medium">
                • {comment.user.role.toLowerCase()}
              </span>
            )}
            <span
              className="text-[11px] text-slate-400 font-normal"
              title={formatDateTime(comment.createdAt)}
            >
              • {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span
                className="text-[10px] text-slate-400 italic font-medium"
                title={`Last edited ${formatDateTime(comment.updatedAt)}`}
              >
                (edited)
              </span>
            )}
          </div>

          {/* Actions: Edit / Delete */}
          {!isEditing && (canEdit || canDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Edit comment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {canDelete && !showConfirmDelete && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Inline Banner */}
        {showConfirmDelete && (
          <div className="my-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs">
            <span className="text-rose-800 font-medium">Delete this comment?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-2 py-1 rounded-lg text-slate-600 hover:bg-white text-[11px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Comment Content / Edit Mode */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSubmittingEdit}
              className="w-full p-2.5 text-xs text-slate-800 border border-blue-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSubmittingEdit}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isSubmittingEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs disabled:opacity-50 transition-colors"
              >
                {isSubmittingEdit ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}
      </div>
    </div>
  );
}

