import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';

function formatCommentDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TaskCommentsSection({ taskId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newText, setNewText] = useState('');
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await taskService.listComments(taskId, currentUser);
      setComments(list || []);
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) {
      setError('Comment text cannot be empty');
      return;
    }
    if (trimmed.length > 5000) {
      setError('Comment text exceeds maximum allowed length of 5000 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await taskService.addComment(taskId, trimmed, currentUser);
      // Immediately display newly submitted comment without full page reload
      setComments((prev) => [...prev, created]);
      setNewText('');
    } catch (err) {
      setError(err.error || err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await taskService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.error || err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Discussion & Comments
          </h3>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 font-medium">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Loading conversation...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 px-4 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-600">No comments yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Start the discussion by posting the first update or question below.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const author = comment.author || {};
            const isAuthor = currentUser && (currentUser.id === comment.authorId || currentUser.id === author.id);
            const isManager = currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER');
            const canDelete = isAuthor || isManager;

            return (
              <div
                key={comment.id}
                className="group p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      name={author.name || 'User'}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {author.name || 'Unknown User'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      title="Delete comment"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-8">
                  {comment.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        <div className="relative">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write a comment or status update..."
            rows={3}
            maxLength={5000}
            disabled={submitting}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {newText.length}/5000 characters
          </span>

          <button
            type="submit"
            disabled={submitting || !newText.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
