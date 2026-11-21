'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File, AlertCircle, X, Camera } from 'lucide-react';
import { formatBytes } from '@/lib/format';

interface FileDropzoneProps {
  acceptedMimeTypes: string;
  acceptLabel: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  onClearAll?: () => void;
}

export default function FileDropzone({
  acceptedMimeTypes,
  acceptLabel,
  multiple = false,
  onFilesSelected,
  files = [],
  onRemoveFile,
  onClearAll,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (!multiple && droppedFiles.length > 1) {
      onFilesSelected([droppedFiles[0]]);
      return;
    }

    onFilesSelected(droppedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;

    onFilesSelected(selected);
    // Reset input value so same file can be re-selected if deleted
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Active File List if files exist */}
      {files.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {files.length} {files.length === 1 ? 'File Selected' : 'Files Selected'}
            </span>
            <div className="flex items-center space-x-2">
              {multiple && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 px-2 py-1 rounded hover:bg-sky-50"
                >
                  + Add More
                </button>
              )}
              {onClearAll && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto mt-2">
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 rounded bg-sky-50 text-sky-600">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
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
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50/60'
          } shadow-sm`}
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {acceptLabel}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            Drag & drop here, or tap to browse your device files
          </p>

          <div className="inline-flex items-center space-x-2 bg-sky-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow hover:bg-sky-700 transition">
            <span>Select {multiple ? 'Files' : 'Document'}</span>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-3 text-xs text-slate-400">
            <span>✓ No file size limits</span>
            <span>•</span>
            <span>✓ Stays on this device</span>
            <span>•</span>
            <span>✓ Zero upload</span>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptedMimeTypes}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
