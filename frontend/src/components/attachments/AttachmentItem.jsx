import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
  Download,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { formatFileSize } from '../../services/attachmentService';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

function getFileIcon(extension) {
  const ext = (extension || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return { icon: ImageIcon, color: 'text-sky-600 bg-sky-50 border-sky-200' };
  }
  if (ext === 'pdf') {
    return { icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  }
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
    return { icon: FileArchive, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  }
  if (['json', 'js', 'ts', 'html', 'css', 'sql'].includes(ext)) {
    return { icon: FileCode, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  }
  return { icon: File, color: 'text-slate-600 bg-slate-50 border-slate-200' };
}

export default function AttachmentItem({
  attachment,
  onDownload,
  onDelete,
}) {
  const { currentUser } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const canDelete = Permissions.canDeleteAttachment(
    currentUser?.role,
    attachment.userId,
    currentUser?.id
  );

  const { icon: IconComponent, color: iconStyle } = getFileIcon(attachment.extension);
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(
    (attachment.extension || '').toLowerCase()
  );

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      await onDownload(attachment);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true);
      await onDelete(attachment.id);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors gap-3">
      {/* File type icon / preview thumbnail */}
      <div className="flex items-center gap-3 min-w-0">
        {isImage && attachment.localUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
            <img
              src={attachment.localUrl}
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconStyle}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
        )}

        {/* File metadata */}
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-bold text-slate-900 truncate"
            title={attachment.name}
          >
            {attachment.name}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span className="truncate">by {attachment.user?.name || 'Member'}</span>
            <span>•</span>
            <span>{formatRelativeTime(attachment.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {showConfirmDelete ? (
          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl text-xs">
            <span className="text-[11px] text-rose-800 font-medium hidden sm:inline">
              Remove?
            </span>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isDeleting}
              className="px-1.5 py-0.5 rounded text-slate-600 hover:bg-white text-[11px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px]"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        ) : (
          <>
            {/* Download button */}
            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Download authorized file"
              aria-label={`Download ${attachment.name}`}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>

            {/* Remove button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove attachment"
                aria-label={`Remove ${attachment.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

