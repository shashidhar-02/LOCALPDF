'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  Type,
  Highlighter,
  Square,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Eye,
  Lock
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyVisualAnnotations, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { VisualAnnotation } from '@/lib/types';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  renderPageThumbnail,
  getCachedPageRender,
  setCachedPageRender
} from '@/lib/pdf-viewer-helper';

export default function AnnotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [docId, setDocId] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});
  const [scale, setScale] = useState<number>(1.2);

  // Active Tool state
  const [toolType, setToolType] = useState<'text' | 'highlight' | 'rectangle' | 'drawing'>('highlight');
  const [textInput, setTextInput] = useState('Comment note');
  const [color, setColor] = useState('#facc15'); // default yellow highlight
  const [fontSize, setFontSize] = useState<number>(14);

  // Annotations & History
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);
  const [history, setHistory] = useState<VisualAnnotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Interaction refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

  const recordHistory = useCallback((newAnns: VisualAnnotation[]) => {
    setHistory((prev) => {
      const current = prev.slice(0, historyIndex + 1);
      return [...current, newAnns];
    });
    setHistoryIndex((prev) => prev + 1);
    setAnnotations(newAnns);
  }, [historyIndex]);

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
      const randomId = `${selected.name}_${selected.size}_${Date.now()}`;

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(count);
      setPdfDoc(loaded);
      setDocId(randomId);
      setCurrentPage(1);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedId(null);

      generateThumbnails(loaded, count);
    } catch {
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  };

  const generateThumbnails = async (loaded: any, pages: number) => {
    const limit = Math.min(pages, 15);
    for (let i = 1; i <= limit; i++) {
      try {
        const thumbUrl = await renderPageThumbnail(loaded, i, 120);
        setThumbnails((prev) => ({ ...prev, [i]: thumbUrl }));
      } catch {
        // Thumbnail error ignored
      }
    }
  };

  // Render current page onto canvas with high-performance caching
  useEffect(() => {
    let isCancelled = false;
    if (!pdfDoc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const cached = getCachedPageRender(docId, currentPage, scale);

    if (cached) {
      const img = new Image();
      img.onload = () => {
        if (isCancelled) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = cached.width;
          canvas.height = cached.height;
          canvas.style.width = `${cached.width / (window.devicePixelRatio || 1)}px`;
          canvas.style.height = `${cached.height / (window.devicePixelRatio || 1)}px`;
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = cached.canvasDataUrl;
      return;
    }

    setIsRenderingPage(true);
    renderPdfPageToCanvas(pdfDoc, currentPage, canvas, scale)
      .then(() => {
        if (isCancelled) return;
        const dataUrl = canvas.toDataURL('image/png');
        setCachedPageRender(docId, currentPage, scale, {
          canvasDataUrl: dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      })
      .catch((err) => {
        if (!isCancelled) console.error('Render error:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsRenderingPage(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, docId]);

  const getRelativePoint = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / scale;
    const relY = (e.clientY - rect.top) / scale;
    return { x: Math.round(relX), y: Math.round(relY) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = getRelativePoint(e);

    if (toolType === 'text') {
      const newAnn: VisualAnnotation = {
        id: `ann_${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x: pt.x,
        y: pt.y,
        color,
        text: textInput || 'Text note',
        fontSize,
      };
      recordHistory([...annotations, newAnn]);
      setSelectedId(newAnn.id);
      return;
    }

    if (toolType === 'drawing') {
      setIsInteracting(true);
      setDrawingPoints([pt]);
      return;
    }

    if (toolType === 'highlight' || toolType === 'rectangle') {
      setIsInteracting(true);
      setStartPt(pt);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    const pt = getRelativePoint(e);

    if (toolType === 'drawing') {
      setDrawingPoints((prev) => [...prev, pt]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    setIsInteracting(false);
    const endPt = getRelativePoint(e);

    if (toolType === 'drawing' && drawingPoints.length > 1) {
      const minX = Math.min(...drawingPoints.map((p) => p.x));
      const minY = Math.min(...drawingPoints.map((p) => p.y));
      const maxX = Math.max(...drawingPoints.map((p) => p.x));
      const maxY = Math.max(...drawingPoints.map((p) => p.y));

      const newAnn: VisualAnnotation = {
        id: `ann_${Date.now()}`,
        type: 'drawing',
        pageNumber: currentPage,
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        color,
        points: drawingPoints,
      };
      recordHistory([...annotations, newAnn]);
      setDrawingPoints([]);
      return;
    }

    if (startPt) {
      const w = Math.max(16, Math.abs(endPt.x - startPt.x));
      const h = Math.max(12, Math.abs(endPt.y - startPt.y));
      const x = Math.min(startPt.x, endPt.x);
      const y = Math.min(startPt.y, endPt.y);

      const newAnn: VisualAnnotation = {
        id: `ann_${Date.now()}`,
        type: toolType,
        pageNumber: currentPage,
        x,
        y,
        width: w,
        height: h,
        color,
        opacity: toolType === 'highlight' ? 0.35 : 1.0,
      };
      recordHistory([...annotations, newAnn]);
      setSelectedId(newAnn.id);
    }

    setStartPt(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setAnnotations(prev);
      setSelectedId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setAnnotations(next);
      setSelectedId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const remaining = annotations.filter((a) => a.id !== selectedId);
    recordHistory(remaining);
    setSelectedId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, annotations, historyIndex, history]);

  const handleSave = async () => {
    if (!fileBytes || !file || annotations.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const output = await applyVisualAnnotations(fileBytes, annotations);
      const baseName = file.name.replace(/\.[^/.]+$/, '') || 'document';
      downloadFile(output, `${baseName}-annotated.pdf`, 'application/pdf');
      setResultBytes(output.byteLength);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save annotations.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageAnns = annotations.filter((a) => a.pageNumber === currentPage);

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to annotate"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          {/* Top Bar */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate max-w-xs sm:max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} • {totalPages} pages • {annotations.length} annotations added
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

              <div className="hidden sm:flex items-center space-x-1 bg-slate-800 rounded-lg px-2 py-1">
                <button
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                  className="p-1 hover:text-sky-400 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 hover:text-sky-400 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={isProcessing || annotations.length === 0}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Annotated PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tool Selector Bar */}
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setToolType('highlight'); setColor('#fde047'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  toolType === 'highlight'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span>Highlight</span>
              </button>

              <button
                type="button"
                onClick={() => { setToolType('text'); setColor('#0f172a'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  toolType === 'text'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Note</span>
              </button>

              <button
                type="button"
                onClick={() => { setToolType('rectangle'); setColor('#ef4444'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  toolType === 'rectangle'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>Box</span>
              </button>

              <button
                type="button"
                onClick={() => { setToolType('drawing'); setColor('#0284c7'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  toolType === 'drawing'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Freehand</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Color:</span>
              {['#facc15', '#ef4444', '#0284c7', '#10b981', '#0f172a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 ${color === c ? 'ring-2 ring-sky-500 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Context Options Bar */}
          {toolType === 'text' && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 text-xs">
              <span className="text-slate-500 font-medium">Text Content:</span>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Note text..."
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
              <span className="text-slate-500 font-medium">Font Size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
              >
                <option value={10}>10 pt</option>
                <option value={12}>12 pt</option>
                <option value={14}>14 pt</option>
                <option value={18}>18 pt</option>
                <option value={24}>24 pt</option>
              </select>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 flex overflow-hidden min-h-[580px] bg-slate-200 dark:bg-slate-950">
            {/* Thumbnail Navigator */}
            <div className="w-36 sm:w-44 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-3 shrink-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pages ({totalPages})
              </p>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const pageAnns = annotations.filter((a) => a.pageNumber === pageNum).length;
                const isSelected = currentPage === pageNum;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-full text-left p-2 rounded-xl transition ${
                      isSelected
                        ? 'bg-sky-500/10 border-2 border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-slate-50 dark:bg-slate-850 rounded overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700">
                      {thumbnails[pageNum] ? (
                        <img
                          src={thumbnails[pageNum]}
                          alt={`Page ${pageNum}`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">P. {pageNum}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-sky-700 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        Page {pageNum}
                      </span>
                      {pageAnns > 0 && (
                        <span className="bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {pageAnns}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Central Canvas */}
            <div className="flex-1 p-6 overflow-auto flex items-center justify-center relative select-none">
              {isRenderingPage && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xs flex items-center justify-center z-20">
                  <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Rendering Page {currentPage}...</span>
                  </div>
                </div>
              )}

              <div
                className="relative shadow-2xl bg-white border border-slate-300 dark:border-slate-700 cursor-crosshair rounded"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <canvas ref={canvasRef} className="block pointer-events-none" />

                {/* Freehand preview path while drawing */}
                {drawingPoints.length > 1 && (
                  <svg className="w-full h-full absolute inset-0 pointer-events-none">
                    <polyline
                      points={drawingPoints.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* Overlay annotations for current page */}
                {currentPageAnns.map((a) => {
                  const isSelected = a.id === selectedId;
                  return (
                    <div
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(a.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${a.x * scale}px`,
                        top: `${a.y * scale}px`,
                        width: a.width ? `${a.width * scale}px` : 'auto',
                        height: a.height ? `${a.height * scale}px` : 'auto',
                        backgroundColor: a.type === 'highlight' ? a.color : 'transparent',
                        borderColor: a.type === 'rectangle' ? a.color : 'transparent',
                        borderWidth: a.type === 'rectangle' ? '2px' : '0px',
                        borderStyle: 'solid',
                        color: a.color,
                        fontSize: a.fontSize ? `${a.fontSize * scale}px` : '14px',
                        opacity: a.opacity ?? 1,
                      }}
                      className={`pointer-events-auto select-none font-bold rounded-xs cursor-pointer group ${
                        isSelected ? 'ring-2 ring-sky-500' : ''
                      }`}
                    >
                      {a.type === 'text' && a.text}

                      {a.type === 'drawing' && a.points && (
                        <svg className="w-full h-full overflow-visible pointer-events-none">
                          <polyline
                            points={a.points.map((p) => `${(p.x - a.x) * scale},${(p.y - a.y) * scale}`).join(' ')}
                            fill="none"
                            stroke={a.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSelected();
                          }}
                          className="absolute -top-3 -right-3 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-900 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Server Guarantee: Annotations applied directly in browser memory</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Annotations Saved Successfully!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Downloaded with all text, highlights, and drawings cleanly embedded.
                {resultBytes && ` Output size: ${formatBytes(resultBytes)}.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
