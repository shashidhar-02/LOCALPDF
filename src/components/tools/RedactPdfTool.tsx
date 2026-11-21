'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Undo2,
  Eye,
  Info
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyPdfEdits, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { PdfEditItem } from '@/lib/types';
import {
  loadPdfDocument,
  renderPdfPageToCanvas
} from '@/lib/pdf-viewer-helper';

export default function RedactPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Redactions list
  const [redactions, setRedactions] = useState<PdfEditItem[]>([]);
  const [redactionLabel, setRedactionLabel] = useState<string>('[REDACTED]');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Canvas interaction
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

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
      setRedactions([]);
      setSelectedId(null);
    } catch {
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  };

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, 1.0).catch(console.error);
    }
  }, [pdfDoc, currentPage]);

  const getRelativePoint = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = getRelativePoint(e);
    setIsDrawing(true);
    setStartPoint(pt);
    setCurrentBox({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const pt = getRelativePoint(e);
    const x = Math.min(startPoint.x, pt.x);
    const y = Math.min(startPoint.y, pt.y);
    const w = Math.abs(pt.x - startPoint.x);
    const h = Math.abs(pt.y - startPoint.y);
    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    setIsDrawing(false);

    if (currentBox.w > 8 && currentBox.h > 6) {
      const newRedaction: PdfEditItem = {
        id: `redaction_${Date.now()}`,
        type: 'redaction',
        pageNumber: currentPage,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.w,
        height: currentBox.h,
        backgroundColor: '#000000',
        text: redactionLabel,
        textColor: '#ffffff',
        fontFamily: 'Helvetica',
        fontSize: 9,
        bold: true,
        opacity: 1.0,
      };
      setRedactions((prev) => [...prev, newRedaction]);
      setSelectedId(newRedaction.id);
    }

    setStartPoint(null);
    setCurrentBox(null);
  };

  // Global window listeners for drag completion outside canvas
  useEffect(() => {
    if (!isDrawing) return;
    const onWindowMouseUp = () => {
      handleMouseUp();
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchend', onWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchend', onWindowMouseUp);
    };
  }, [isDrawing, currentBox, startPoint, currentPage, redactionLabel]);

  const handleDeleteRedaction = (id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDownloadRedacted = async () => {
    if (!fileBytes || redactions.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const output = await applyPdfEdits(fileBytes, redactions);
      const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'document';
      downloadFile(output, `${baseName}-redacted.pdf`, 'application/pdf');
      setResultBytes(output.byteLength);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply redactions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageRedactions = redactions.filter((r) => r.pageNumber === currentPage);

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to redact"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 mb-1">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-lg">Legal Redaction Tool</h3>
              </div>
              <p className="text-xs text-slate-500">
                Permanently black out private information (SSNs, accounts, names, addresses) directly in your browser.
              </p>
            </div>

            {/* Label option */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Redaction Overlay Label
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={redactionLabel}
                  onChange={(e) => setRedactionLabel(e.target.value)}
                  placeholder="[REDACTED]"
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setRedactionLabel('')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border ${
                    redactionLabel === '' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                  title="Solid Blackout with no text"
                >
                  Solid
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['[REDACTED]', '[CONFIDENTIAL]', '[FOIA EXEMPT]', '[PRIVILEGED]'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setRedactionLabel(lbl)}
                    className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>How to Redact</span>
              </div>
              <p>Click and drag over any sensitive text in the preview to blackout the area permanently.</p>
            </div>

            {/* Current Page Redactions Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Marked Areas ({redactions.length} total)</span>
                {redactions.length > 0 && (
                  <button
                    onClick={() => setRedactions([])}
                    className="text-red-600 hover:underline text-[11px]"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {currentPageRedactions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No redactions on Page {currentPage} yet.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {currentPageRedactions.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-black rounded-xs inline-block" />
                        <span className="font-mono text-slate-700">Box #{i + 1} ({Math.round(r.width)}x{Math.round(r.height)}pt)</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRedaction(r.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete redaction box"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadRedacted}
              disabled={isProcessing || redactions.length === 0}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Applying Permanent Redactions...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Redacted PDF ({redactions.length})</span>
                </>
              )}
            </button>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>True client-side sanitization. PDF never leaves your computer.</span>
            </div>
          </div>

          {/* Interactive Document Viewport */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-sky-600" />
                <span>Page {currentPage} of {totalPages} (Drag to blackout)</span>
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

            {/* Interactive Canvas */}
            <div
              className="relative border border-slate-300 shadow-md bg-white rounded cursor-crosshair select-none touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  const t = e.touches[0];
                  handleMouseDown({ clientX: t.clientX, clientY: t.clientY } as any);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  const t = e.touches[0];
                  handleMouseMove({ clientX: t.clientX, clientY: t.clientY } as any);
                }
              }}
              onTouchEnd={() => {
                handleMouseUp();
              }}
            >
              <canvas ref={canvasRef} className="block pointer-events-none" />

              {/* Existing Redactions Overlay on current page */}
              {currentPageRedactions.map((r) => (
                <div
                  key={r.id}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{
                    left: `${r.x}px`,
                    top: `${r.y}px`,
                    width: `${r.width}px`,
                    height: `${r.height}px`,
                  }}
                  className="absolute bg-black text-white text-[9px] font-bold font-mono flex items-center justify-center border border-red-500/50 group"
                >
                  <span className="truncate px-1">{r.text || '[REDACTED]'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRedaction(r.id);
                    }}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Active Drawing Box Preview */}
              {currentBox && isDrawing && (
                <div
                  style={{
                    left: `${currentBox.x}px`,
                    top: `${currentBox.y}px`,
                    width: `${currentBox.w}px`,
                    height: `${currentBox.h}px`,
                  }}
                  className="absolute bg-black/80 border-2 border-red-500 pointer-events-none"
                />
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
              <p className="font-bold text-sm">Redaction Complete!</p>
              <p className="text-xs text-emerald-700">
                Sensitive content was permanently overwritten with vector blackouts in local memory.
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
