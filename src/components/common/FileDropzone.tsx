'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '@/lib/format';

interface FileDropzoneProps {
  acceptedMimeTypes: string;
  acceptLabel: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  onClearAll?: () => void;
  description?: string;
}

export default function FileDropzone({
  acceptedMimeTypes,
  acceptLabel,
  multiple = false,
  onFilesSelected,
  files = [],
  onRemoveFile,
  onClearAll,
  description,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize accepted extensions for bulletproof browser & OS compatibility
  const normalizedAccept = React.useMemo(() => {
    const list = acceptedMimeTypes.split(',').map((s) => s.trim());
    const extensions: string[] = [];

    if (acceptedMimeTypes.includes('pdf')) {
      extensions.push('.pdf', '.PDF', 'application/pdf');
    }
    if (acceptedMimeTypes.includes('image')) {
      extensions.push(
        'image/jpeg',
        'image/png',
        'image/webp',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.JPG',
        '.PNG'
      );
    }
    return Array.from(new Set([...list, ...extensions])).join(',');
  }, [acceptedMimeTypes]);

  // Validates file format safely across Windows / Mac / Linux / Mobile
  const validateFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (acceptedMimeTypes.includes('pdf')) {
      return (
        type === 'application/pdf' ||
        type === 'application/x-pdf' ||
        name.endsWith('.pdf')
      );
    }

    if (acceptedMimeTypes.includes('image')) {
      return (
        type.startsWith('image/') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp')
      );
    }

    return true;
  };

  const processFiles = (selectedFiles: File[]) => {
    setError(null);
    if (selectedFiles.length === 0) return;

    // Filter valid files
    const valid = selectedFiles.filter(validateFile);

    if (valid.length === 0) {
      if (acceptedMimeTypes.includes('pdf')) {
        setError('Please select valid PDF documents (.pdf).');
      } else if (acceptedMimeTypes.includes('image')) {
        setError('Please select valid images (JPG, PNG, WebP).');
      } else {
        setError('Selected file type is not supported.');
      }
      return;
    }

    if (!multiple) {
      onFilesSelected([valid[0]]);
    } else {
      onFilesSelected(valid);
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    processFiles(selected);
  };

  return (
    <div className="w-full">
      {/* Active File List if files exist */}
      {files.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {files.length} {files.length === 1 ? 'File Selected' : 'Files Selected'}
            </span>
            <div className="flex items-center space-x-2">
              {multiple && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 px-2 py-1 rounded hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                >
                  + Add More
                </button>
              )}
              {onClearAll && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto mt-2">
            {files.map((fileItem, idx) => (
              <div
                key={`${fileItem.name}-${idx}`}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                      {fileItem.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatBytes(fileItem.size)}
                    </p>
                  </div>
                </div>

                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 bg-white dark:bg-slate-900/80 hover:bg-slate-50/70 dark:hover:bg-slate-850'
          } shadow-sm group`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto mb-4 group-hover:scale-105 transition-transform shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
            {acceptLabel}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            {description || 'Drag & drop here, or tap to choose files from your computer or phone'}
          </p>

          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95">
            <span>Select {multiple ? 'Files' : 'Document'}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>No file size limits</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% In-Memory</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero server upload</span>
            </span>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={normalizedAccept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
