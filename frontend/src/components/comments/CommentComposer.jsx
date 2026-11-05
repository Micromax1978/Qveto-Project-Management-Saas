import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, CornerDownLeft } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

export default function CommentComposer({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment... (Ctrl+Enter to post)',
  autoFocus = false,
}) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    onSubmit(content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setContent(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const canSubmit = Boolean(content.trim()) && !isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border transition-all duration-200 bg-white ${
        isFocused
          ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-xs'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-3">
        <div className="flex gap-3 items-start">
          <Avatar user={currentUser} size="sm" showTooltip={false} />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={2}
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isSubmitting}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent resize-none focus:outline-hidden leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="hidden sm:inline">Use Ctrl+Enter to submit</span>
            {content.length > 0 && (
              <span>• {content.length} characters</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {content.trim() && (
              <button
                type="button"
                onClick={() => {
                  setContent('');
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }}
                disabled={isSubmitting}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <span>Comment</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

