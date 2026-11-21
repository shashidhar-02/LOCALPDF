'use client';

import React, { useState } from 'react';
import { Download, ArrowUp, ArrowDown, Trash2, Loader2, File, CheckCircle2 } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { mergePDFs, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';

interface PdfFileItem {
  id: string;
  file: File;
  bytes: Uint8Array;
  pageCount: number;
}

export default function MergePdfTool() {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setSuccess(false);

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const pageCount = await getPDFPageCount(bytes);

        setPdfFiles((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            bytes,
            pageCount,
          },
        ]);
      } catch (err: any) {
        setError(`Could not read "${file.name}": File may be corrupt or encrypted.`);
      }
    }
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= pdfFiles.length) return;
    setPdfFiles((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRemove = (idx: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const mergedBytes = await mergePDFs(pdfFiles.map((p) => p.bytes));
      downloadFile(mergedBytes, 'merged_document.pdf');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error occurred while merging PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = pdfFiles.reduce((acc, p) => acc + p.pageCount, 0);

  return (
    <div className="space-y-6">
      <FileDropzone
        acceptedMimeTypes="application/pdf"
        acceptLabel="Select 2 or more PDF files to merge"
        multiple={true}
        onFilesSelected={handleFilesSelected}
      />

      {pdfFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Documents in Merge Order ({pdfFiles.length} files, {totalPages} total pages)
              </h4>
              <p className="text-xs text-slate-500">
                Drag or use arrows to adjust sequence. Top document will become page 1.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPdfFiles([])}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {pdfFiles.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="p-1.5 rounded bg-white text-slate-600 shadow-sm shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-3">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 rounded-lg disabled:opacity-25"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pdfFiles.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 rounded-lg disabled:opacity-25"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>PDFs successfully merged and downloaded! Your original files remained local.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Output file: <strong className="text-slate-700">merged_document.pdf</strong>
            </span>

            <button
              type="button"
              disabled={isProcessing || pdfFiles.length < 2}
              onClick={handleMerge}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging locally...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Merge {pdfFiles.length} PDFs</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
