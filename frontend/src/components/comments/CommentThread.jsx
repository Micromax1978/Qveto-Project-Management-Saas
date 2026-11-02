import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentComposer from './CommentComposer';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../ui/EmptyState';

export default function CommentThread({ taskId, onActivityLogged }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getComments(taskId, currentUser);
      setComments(data);
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async (content) => {
    if (!content.trim()) return;

    // Optimistic item
    const tempId = `temp_${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      taskId,
      orgId: currentUser.orgId,
      userId: currentUser.id,
      user: currentUser,
      content,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      setSubmitting(true);
      const created = await commentService.addComment(taskId, content, currentUser);
      // Replace optimistic comment with persisted comment
      setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      showToast({
        type: 'success',
        title: 'Comment Posted',
        message: 'Your comment has been added to the task.',
      });
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      // Rollback optimistic comment
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      showToast({
        type: 'error',
        title: 'Failed to post comment',
        message: err.message || 'Unable to post your comment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const updated = await commentService.updateComment(commentId, newContent, currentUser);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      showToast({
        type: 'success',
        title: 'Comment Updated',
        message: 'Your edits have been saved.',
      });
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Unable to update comment.',
      });
      throw err;
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId, currentUser);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showToast({
        type: 'success',
        title: 'Comment Deleted',
        message: 'The comment was removed.',
      });
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Unable to delete comment.',
      });
      throw err;
    }
  };

  return (
    <div className="space-y-4">
      {/* Thread Header with Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Comments & Discussion
          </h3>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {comments.length}
        </span>
      </div>

      {/* Composer */}
      <CommentComposer onSubmit={handleAddComment} isSubmitting={submitting} />

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
          <button
            type="button"
            onClick={loadComments}
            className="ml-auto underline font-semibold text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <MessageSquare className="w-7 h-7 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No comments yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Start the conversation, share sprint updates, or mention team members.
          </p>
        </div>
      ) : (
        /* Chronological Comments Stream */
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

