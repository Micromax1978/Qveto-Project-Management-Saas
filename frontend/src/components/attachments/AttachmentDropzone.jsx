import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, AlertCircle, FileCheck } from 'lucide-react';
import {
  MAX_ATTACHMENT_SIZE_LABEL,
  ALLOWED_EXTENSIONS,
} from '../../constants/collaboration';
import { validateAttachmentFile } from '../../services/attachmentService';

export default function AttachmentDropzone({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFile = (file) => {
    if (!file) return;
    setValidationError(null);

    const validation = validateAttachmentFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = ''; // Reset input to allow re-upload of same filename
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
          isUploading
            ? 'border-blue-400 bg-blue-50/30 cursor-wait'
            : isDragOver
            ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
            : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        />

        <div className="flex flex-col items-center justify-center gap-1.5">
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-800">
                Uploading attachment... {uploadProgress}%
              </p>
              {/* Progress bar */}
              <div className="w-48 h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                <span className="text-blue-600 font-bold hover:underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, PDF, DOCX, XLSX, JSON or ZIP up to {MAX_ATTACHMENT_SIZE_LABEL}
              </p>
            </>
          )}
        </div>
      </div>

      {validationError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="flex-1">{validationError}</span>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

