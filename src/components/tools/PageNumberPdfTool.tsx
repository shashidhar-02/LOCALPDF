'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { addPageNumbersToDocument, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import {
  loadPdfDocument,
  renderPdfPageToCanvas
} from '@/lib/pdf-viewer-helper';

export default function PageNumberPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Numbering options
  const [prefix, setPrefix] = useState<string>('Page ');
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setSuccess(false);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const count = await getPDFPageCount(bytes);
      const loaded = await loadPdfDocument(bytes);

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(count);
      setPdfDoc(loaded);
      setCurrentPage(1);
    } catch {
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  };

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, 1.0).catch(console.error);
    }
  }, [pdfDoc, currentPage]);

  const handleDownloadNumbered = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const output = await addPageNumbersToDocument(fileBytes, position, prefix);
      const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'document';
      downloadFile(output, `${baseName}-numbered.pdf`, 'application/pdf');
      setResultBytes(output.byteLength);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to add page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to add page numbers"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <Hash className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-lg">Page Numbering Settings</h3>
              </div>
              <p className="text-xs text-slate-500">
                Stamp clean page numbers or Bates numbering across all document pages automatically.
              </p>
            </div>

            {/* Prefix / Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Numbering Prefix / Style
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. Page "
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-sky-500 bg-slate-50 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'Page 1 of N', val: 'Page ' },
                  { label: '1 of N (Numbers only)', val: '' },
                  { label: 'Doc-1 of N', val: 'Doc-' },
                  { label: 'Bates-1 of N', val: 'Bates-' },
                ].map((fmt) => (
                  <button
                    key={fmt.label}
                    type="button"
                    onClick={() => setPrefix(fmt.val)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      prefix === fmt.val
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Placement Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom-center', label: 'Bottom Center' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                  { id: 'top-right', label: 'Top Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id as any)}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                      position === pos.id
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview text */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 block font-semibold">Rendered label preview:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                &quot;{prefix}{currentPage} of {totalPages}&quot;
              </span>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadNumbered}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Stamping Page Numbers...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Numbered PDF ({totalPages} pages)</span>
                </>
              )}
            </button>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Processed locally via WebAssembly. Your files stay on your device.</span>
            </div>
          </div>

          {/* Document Preview Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Page {currentPage} of {totalPages}</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas with dynamic numbering positioning */}
            <div className="relative border border-slate-200 shadow-md bg-white rounded max-h-[580px] overflow-hidden">
              <canvas ref={canvasRef} className="block pointer-events-none max-h-[580px] w-auto" />

              {/* Simulated Page Number */}
              <div
                className={`absolute pointer-events-none p-3 text-xs font-mono font-bold text-slate-800 bg-white/70 backdrop-blur-xs rounded ${
                  position === 'bottom-center'
                    ? 'bottom-2 left-1/2 -translate-x-1/2'
                    : position === 'bottom-right'
                    ? 'bottom-2 right-4'
                    : 'top-2 right-4'
                }`}
              >
                {prefix}{currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Page Numbers Added Successfully!</p>
              <p className="text-xs text-emerald-700">
                Document downloaded with clean vector numbering across all {totalPages} pages.
                {resultBytes && ` Output size: ${formatBytes(resultBytes)}.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
