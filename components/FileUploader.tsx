
import React, { useState, useRef } from 'react';
import { uploadFile, MediaType } from '../services/storage';

interface FileUploaderProps {
  mediaType: MediaType;
  folder?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  mediaType,
  folder,
  onUploadComplete,
  accept,
  maxSize = 50,
  label = 'اختر ملف'
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadFile(file, mediaType, {
        folder,
        maxSize,
        onProgress: (p) => setProgress(p)
      });

      onUploadComplete(result.url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full px-6 py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold hover:bg-slate-750 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري الرفع... {progress.toFixed(0)}%</span>
          </>
        ) : (
          <>
            <span className="text-xl">📁</span>
            <span>{label}</span>
          </>
        )}
      </button>

      {uploading && (
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs text-right">
          {error}
        </div>
      )}
    </div>
  );
};
