'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Droplet,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { addWatermarkToDocument, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import {
  loadPdfDocument,
  renderPdfPageToCanvas
} from '@/lib/pdf-viewer-helper';

const PRESET_WATERMARKS = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'INTERNAL ONLY', 'ORIGINAL'];

export default function WatermarkPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Watermark options
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [opacity, setOpacity] = useState<number>(0.2);
  const [rotation, setRotation] = useState<number>(45); // 0, 45, 90
  const [textColor, setTextColor] = useState<string>('#dc2626'); // red

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
      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(count);
      setCurrentPage(1);

      try {
        const loaded = await loadPdfDocument(bytes);
        setPdfDoc(loaded);
      } catch (previewErr) {
        console.warn('PDF.js preview could not be loaded:', previewErr);
      }
    } catch {
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  };

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, 1.0).catch(console.error);
    }
  }, [pdfDoc, currentPage]);

  const handleDownloadWatermarked = async () => {
    if (!fileBytes || !watermarkText.trim()) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const output = await addWatermarkToDocument(fileBytes, watermarkText.trim(), opacity);
      const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'document';
      downloadFile(output, `${baseName}-watermarked.pdf`, 'application/pdf');
      setResultBytes(output.byteLength);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to watermark"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-sky-600 mb-1">
                <Droplet className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-lg">Watermark Settings</h3>
              </div>
              <p className="text-xs text-slate-500">
                Stamp semi-transparent diagonal watermarks across all pages completely in your browser.
              </p>
            </div>

            {/* Watermark text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-sky-500 bg-slate-50 focus:bg-white transition-colors"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_WATERMARKS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWatermarkText(preset)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      watermarkText === preset
                        ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Opacity</span>
                <span className="font-mono text-sky-600">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Subtle (10%)</span>
                <span>Standard (20%)</span>
                <span>Prominent (50%)</span>
              </div>
            </div>

            {/* Primary Download Button */}
            <button
              onClick={handleDownloadWatermarked}
              disabled={isProcessing || !watermarkText.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Watermarked PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Watermarked PDF</span>
                </>
              )}
            </button>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Processed 100% locally on your device memory. Zero uploads.</span>
            </div>
          </div>

          {/* Document Live Preview Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-sky-600" />
                <span>Page Preview ({currentPage} of {totalPages})</span>
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

            {/* Preview Box with Simulated Watermark Overlay */}
            <div className="relative border border-slate-200 shadow-md bg-white max-h-[580px] overflow-hidden rounded">
              <canvas ref={canvasRef} className="block pointer-events-none max-h-[580px] w-auto" />

              {/* Live Simulated Watermark Overlay */}
              {watermarkText.trim() && (
                <div
                  style={{ opacity }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                >
                  <span
                    style={{
                      transform: 'rotate(-45deg)',
                      color: textColor,
                      fontSize: 'clamp(2rem, 6vw, 4.5rem)',
                      letterSpacing: '0.1em',
                    }}
                    className="font-black whitespace-nowrap uppercase tracking-widest text-center"
                  >
                    {watermarkText}
                  </span>
                </div>
              )}
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
              <p className="font-bold text-sm">Watermark Applied Successfully!</p>
              <p className="text-xs text-emerald-700">
                Document downloaded with clean vector watermarks across all {totalPages} pages.
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
