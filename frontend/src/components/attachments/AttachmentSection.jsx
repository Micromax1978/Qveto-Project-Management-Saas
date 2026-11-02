import React, { useState, useEffect, useCallback } from 'react';
import { Paperclip, Loader2, AlertCircle } from 'lucide-react';
import AttachmentDropzone from './AttachmentDropzone';
import AttachmentItem from './AttachmentItem';
import { attachmentService } from '../../services/attachmentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AttachmentSection({ taskId, onActivityLogged }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const loadAttachments = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await attachmentService.getAttachments(taskId, currentUser);
      setAttachments(data);
    } catch (err) {
      setError(err.message || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUpload = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const created = await attachmentService.uploadAttachment(
        taskId,
        file,
        currentUser,
        (progress) => setUploadProgress(progress)
      );

      setAttachments((prev) => [created, ...prev]);
      showToast({
        type: 'success',
        title: 'File Uploaded',
        message: `"${file.name}" has been attached to the task.`,
      });
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Unable to upload file.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      await attachmentService.downloadAttachment(attachment, currentUser);
      showToast({
        type: 'success',
        title: 'Download Started',
        message: `Downloading "${attachment.name}".`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Unable to download file.',
      });
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await attachmentService.deleteAttachment(attachmentId, currentUser);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      showToast({
        type: 'success',
        title: 'Attachment Removed',
        message: 'The file was removed from the task.',
      });
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Remove Failed',
        message: err.message || 'Unable to delete attachment.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Attachments & Assets
          </h3>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {attachments.length}
        </span>
      </div>

      {/* Upload Dropzone */}
      <AttachmentDropzone
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
          <button
            type="button"
            onClick={loadAttachments}
            className="ml-auto underline font-semibold text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* List / Loading / Empty State */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading attachments...</span>
        </div>
      ) : attachments.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <Paperclip className="w-7 h-7 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No attachments yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Attach mockups, architectural specifications, or logs to this task.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

