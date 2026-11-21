'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, Scissors } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { splitPDF, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { parsePageRange } from '@/lib/page-ranges';

export default function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<'all' | 'range' | 'odd' | 'even'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setSuccess(false);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const pages = await getPDFPageCount(bytes);

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(pages);
      setRangeInput(pages >= 2 ? `1-${Math.min(2, pages)}` : '1');
    } catch (err: any) {
      setError('Could not open PDF file. It may be corrupt or encrypted.');
    }
  };

  const handleSplit = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'range') {
        const { errors } = parsePageRange(rangeInput, totalPages);
        if (errors.length > 0) {
          setError(errors.join(' '));
          setIsProcessing(false);
          return;
        }
      }

      const results = await splitPDF(fileBytes, {
        mode,
        rangeText: rangeInput,
      });

      for (const res of results) {
        downloadFile(res.data, `${file.name.replace('.pdf', '')}_${res.name}`);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select a PDF to split"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      )}

      {file && (
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
              <p className="text-xs text-slate-500">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} total • {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setTotalPages(0);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Split Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'range'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1">Custom Ranges</div>
              <p className="text-xs text-slate-500">Extract ranges like 1-3, 4-6</p>
            </button>

            <button
              type="button"
              onClick={() => setMode('all')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'all'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1">Every Page</div>
              <p className="text-xs text-slate-500">Save each page as a single PDF</p>
            </button>

            <button
              type="button"
              onClick={() => setMode('odd')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'odd'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1">Odd Pages</div>
              <p className="text-xs text-slate-500">Pages 1, 3, 5, 7...</p>
            </button>

            <button
              type="button"
              onClick={() => setMode('even')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'even'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1">Even Pages</div>
              <p className="text-xs text-slate-500">Pages 2, 4, 6, 8...</p>
            </button>
          </div>

          {/* Mode Options */}
          {mode === 'range' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Enter Page Ranges (e.g. 1-2, 3-5)
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="1-2, 3-5"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Each range segment separated by comma will be downloaded as a separate file. Total pages in doc: {totalPages}.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pages split and downloaded successfully!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSplit}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Splitting pages locally...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Split PDF Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
