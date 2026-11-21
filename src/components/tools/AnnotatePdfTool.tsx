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
  RotateCcw,
  AlertCircle,
  Lock,
  Sparkles,
  MousePointer
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyVisualAnnotations, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { VisualAnnotation, DetectedPdfTextItem } from '@/lib/types';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  renderPageThumbnail,
  extractPageTextItems,
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
  const [toolType, setToolType] = useState<'highlight' | 'drawing' | 'text' | 'rectangle'>('highlight');
  const [textInput, setTextInput] = useState('Comment note');
  const [color, setColor] = useState('#facc15'); // default yellow highlight
  const [fontSize, setFontSize] = useState<number>(14);
  const [strokeWidth, setStrokeWidth] = useState<number>(2);

  // Smart text detection
  const [showTextLayer, setShowTextLayer] = useState<boolean>(false);
  const [isDetectingText, setIsDetectingText] = useState<boolean>(false);
  const [detectedTexts, setDetectedTexts] = useState<DetectedPdfTextItem[]>([]);

  // Annotations & History
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);
  const [history, setHistory] = useState<VisualAnnotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Interaction refs & live drag state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  // Async states
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

  // History tracking
  const recordHistory = useCallback((newAnns: VisualAnnotation[]) => {
    setHistory((prev) => {
      const current = prev.slice(0, historyIndex + 1);
      return [...current, newAnns];
    });
    setHistoryIndex((prev) => prev + 1);
    setAnnotations(newAnns);
  }, [historyIndex]);

  // Handle file upload
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setSuccess(false);
    setIsLoadingFile(true);

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
      setShowTextLayer(false);
      setDetectedTexts([]);

      // Asynchronously load thumbnails with delay so main page canvas renders first
      setTimeout(() => {
        generateThumbnails(loaded, count);
      }, 150);
    } catch (err: any) {
      console.error('Annotate PDF load error:', err);
      setError(err?.message || 'Could not load PDF document. Please ensure the file is not corrupted or password-protected.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const generateThumbnails = async (loaded: any, pages: number) => {
    const limit = Math.min(pages, 15);
    for (let i = 1; i <= limit; i++) {
      try {
        const thumbUrl = await renderPageThumbnail(loaded, i, 120);
        setThumbnails((prev) => ({ ...prev, [i]: thumbUrl }));
      } catch {
        // Thumbnail generation failure ignored
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
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setCachedPageRender(docId, currentPage, scale, {
            canvasDataUrl: dataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        } catch {
          // toDataURL taint safety fallback
        }
      })
      .catch((err) => {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error('Render page error:', err);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsRenderingPage(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, docId]);

  // Extract text items when Smart Text Detect is activated
  const handleToggleSmartText = async () => {
    if (showTextLayer) {
      setShowTextLayer(false);
      return;
    }
    if (!pdfDoc) return;
    setIsDetectingText(true);
    try {
      const items = await extractPageTextItems(pdfDoc, currentPage);
      setDetectedTexts(items);
      setShowTextLayer(true);
    } catch (err) {
      console.error('Smart text extraction failed:', err);
    } finally {
      setIsDetectingText(false);
    }
  };

  const handleHighlightDetectedText = (dt: DetectedPdfTextItem) => {
    const newAnn: VisualAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'highlight',
      pageNumber: currentPage,
      x: dt.x,
      y: dt.y,
      width: dt.width,
      height: dt.height,
      color,
      opacity: 0.35,
    };
    recordHistory([...annotations, newAnn]);
    setSelectedId(newAnn.id);
  };

  // Convert screen coordinates to PDF 72 DPI points
  const getRelativePoint = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = (clientX - rect.left) / scale;
    const relY = (clientY - rect.top) / scale;
    return {
      x: Math.max(0, Math.round(relX)),
      y: Math.max(0, Math.round(relY))
    };
  };

  // Pointer Handlers (unified Mouse & Touch)
  const handlePointerDown = (clientX: number, clientY: number) => {
    const pt = getRelativePoint(clientX, clientY);

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

    setIsInteracting(true);
    setStartPt(pt);
    setDragCurrent(pt);

    if (toolType === 'drawing') {
      setDrawingPoints([pt]);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isInteracting) return;
    const pt = getRelativePoint(clientX, clientY);
    setDragCurrent(pt);

    if (toolType === 'drawing') {
      setDrawingPoints((prev) => [...prev, pt]);
    }
  };

  const handlePointerUp = (clientX?: number, clientY?: number) => {
    if (!isInteracting) return;
    setIsInteracting(false);

    const endPt = clientX !== undefined && clientY !== undefined
      ? getRelativePoint(clientX, clientY)
      : dragCurrent || startPt;

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
      setStartPt(null);
      setDragCurrent(null);
      return;
    }

    if (startPt && endPt && (toolType === 'highlight' || toolType === 'rectangle')) {
      const dist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
      const isSingleClick = dist < 5;
      const w = isSingleClick ? (toolType === 'highlight' ? 120 : 140) : Math.max(16, Math.abs(endPt.x - startPt.x));
      const h = isSingleClick ? (toolType === 'highlight' ? 18 : 60) : Math.max(10, Math.abs(endPt.y - startPt.y));
      const x = isSingleClick ? startPt.x : Math.min(startPt.x, endPt.x);
      const y = isSingleClick ? startPt.y : Math.min(startPt.y, endPt.y);

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
    setDragCurrent(null);
    setDrawingPoints([]);
  };

  // Global window listeners to catch pointerup outside canvas
  useEffect(() => {
    if (!isInteracting) return;

    const onGlobalMouseUp = (e: MouseEvent) => {
      handlePointerUp(e.clientX, e.clientY);
    };
    const onGlobalTouchEnd = () => {
      handlePointerUp();
    };

    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('touchend', onGlobalTouchEnd);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('touchend', onGlobalTouchEnd);
    };
  }, [isInteracting, startPt, dragCurrent, drawingPoints, toolType, color, currentPage, annotations]);

  // Undo / Redo
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

  const handleClearAll = () => {
    if (annotations.length === 0) return;
    if (window.confirm('Clear all annotations on this document?')) {
      recordHistory([]);
      setSelectedId(null);
    }
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

  // Save / Download annotated document
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
      console.error('Annotation save error:', err);
      setError(err?.message || 'Failed to save and embed annotations into PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageAnns = annotations.filter((a) => a.pageNumber === currentPage);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      {isLoadingFile && (
        <div className="p-8 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm font-bold text-sky-900 dark:text-sky-300">
            Loading PDF Document in Local Memory...
          </p>
          <p className="text-xs text-sky-700 dark:text-sky-400">
            Initializing zero-server sandbox viewer. Your files never leave your device.
          </p>
        </div>
      )}

      {!file && !isLoadingFile ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to annotate"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          description="Drag and drop any PDF to highlight text, draw freehand, stamp notes, and add callout boxes."
        />
      ) : file && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          {/* Top Control Bar */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate max-w-xs sm:max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} • {totalPages} pages • {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} added
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
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
                  type="button"
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
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 hover:text-sky-400 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {annotations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-red-100 transition text-xs font-semibold"
                  title="Clear all annotations"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
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
                onClick={() => { setToolType('highlight'); setColor('#facc15'); }}
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
                onClick={() => { setToolType('drawing'); setColor('#0284c7'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  toolType === 'drawing'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Freehand Pen</span>
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

              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={handleToggleSmartText}
                disabled={isDetectingText}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  showTextLayer
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                }`}
                title="Acrobat-style Smart Text Detection: click any word or sentence to highlight"
              >
                {isDetectingText ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Smart Text Detect</span>
              </button>
            </div>

            {/* Colors Palette */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Color:</span>
              {['#facc15', '#4ade80', '#60a5fa', '#f472b6', '#ef4444', '#0284c7', '#0f172a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 transition ${
                    color === c ? 'ring-2 ring-sky-500 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Context Options Sub-Bar */}
          {toolType === 'text' && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Text Content:</span>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Click page to stamp this text..."
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white w-48 sm:w-64"
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
              <span className="text-slate-400 italic">Click anywhere on page to place note.</span>
            </div>
          )}

          {toolType === 'drawing' && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 text-xs">
              <span className="text-slate-500 font-medium">Pen Thickness:</span>
              {[1.5, 2.5, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setStrokeWidth(w)}
                  className={`px-2 py-0.5 rounded border text-xs font-semibold ${
                    strokeWidth === w
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {w}px
                </button>
              ))}
              <span className="text-slate-400 italic">Click and drag to sketch or draw signatures.</span>
            </div>
          )}

          {toolType === 'highlight' && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <MousePointer className="w-3.5 h-3.5 text-sky-500" />
                <span>
                  <strong>Tip:</strong> Click & drag to highlight any custom area, or single-click for a standard highlight block.
                </span>
              </div>
              {showTextLayer && (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Smart Text layer active: click words to highlight instantly.
                </span>
              )}
            </div>
          )}

          {/* Main Interactive Workspace */}
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
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      setShowTextLayer(false);
                      setDetectedTexts([]);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition ${
                      isSelected
                        ? 'bg-sky-500/10 border-2 border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
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

            {/* Central Canvas Workspace */}
            <div
              className="flex-1 p-6 overflow-auto flex items-center justify-center relative select-none"
              onClick={() => setSelectedId(null)}
            >
              {isRenderingPage && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xs flex items-center justify-center z-30">
                  <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Rendering Page {currentPage}...</span>
                  </div>
                </div>
              )}

              <div
                ref={containerRef}
                className="relative shadow-2xl bg-white border border-slate-300 dark:border-slate-700 cursor-crosshair rounded touch-none"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e.clientX, e.clientY);
                }}
                onMouseMove={(e) => {
                  handlePointerMove(e.clientX, e.clientY);
                }}
                onMouseUp={(e) => {
                  handlePointerUp(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (e.touches.length === 1) {
                    handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 1) {
                    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchEnd={() => {
                  handlePointerUp();
                }}
              >
                <canvas ref={canvasRef} className="block pointer-events-none" />

                {/* Smart Detected Text Click Layer */}
                {showTextLayer && detectedTexts.map((dt) => (
                  <div
                    key={dt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHighlightDetectedText(dt);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${dt.x * scale}px`,
                      top: `${dt.y * scale}px`,
                      width: `${dt.width * scale}px`,
                      height: `${dt.height * scale}px`,
                    }}
                    className="z-10 hover:bg-yellow-400/30 border border-transparent hover:border-yellow-500 rounded cursor-pointer transition"
                    title={`Click to highlight: "${dt.str}"`}
                  />
                ))}

                {/* Freehand preview path while actively drawing */}
                {isInteracting && toolType === 'drawing' && drawingPoints.length > 1 && (
                  <svg className="w-full h-full absolute inset-0 pointer-events-none z-20">
                    <polyline
                      points={drawingPoints.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* Live Drag Preview for Highlight / Rectangle */}
                {isInteracting && startPt && dragCurrent && (toolType === 'highlight' || toolType === 'rectangle') && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.min(startPt.x, dragCurrent.x) * scale}px`,
                      top: `${Math.min(startPt.y, dragCurrent.y) * scale}px`,
                      width: `${Math.max(8, Math.abs(dragCurrent.x - startPt.x)) * scale}px`,
                      height: `${Math.max(6, Math.abs(dragCurrent.y - startPt.y)) * scale}px`,
                      backgroundColor: toolType === 'highlight' ? color : 'transparent',
                      borderColor: color,
                      borderWidth: toolType === 'rectangle' ? '2px' : '1px',
                      borderStyle: toolType === 'rectangle' ? 'solid' : 'dashed',
                      opacity: toolType === 'highlight' ? 0.35 : 1,
                    }}
                    className="pointer-events-none z-20 rounded-xs"
                  />
                )}

                {/* Overlay Saved Annotations for Current Page */}
                {currentPageAnns.map((a) => {
                  const isSelected = a.id === selectedId;
                  return (
                    <div
                      key={a.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(a.id);
                      }}
                      onTouchStart={(e) => {
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
                      className={`pointer-events-auto select-none font-bold rounded-xs cursor-pointer group z-10 ${
                        isSelected ? 'ring-2 ring-sky-500 shadow-sm' : ''
                      }`}
                    >
                      {a.type === 'text' && a.text}

                      {a.type === 'drawing' && a.points && (
                        <svg className="w-full h-full overflow-visible pointer-events-none">
                          <polyline
                            points={a.points.map((p) => `${(p.x - a.x) * scale},${(p.y - a.y) * scale}`).join(' ')}
                            fill="none"
                            stroke={a.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {/* Delete button on active selection */}
                      {isSelected && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleDeleteSelected();
                          }}
                          className="absolute -top-3.5 -right-3.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition z-30"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <span>Zero-Server Guarantee: Annotations are compiled and embedded 100% locally in browser memory</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  setShowTextLayer(false);
                  setDetectedTexts([]);
                }}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  setShowTextLayer(false);
                  setDetectedTexts([]);
                }}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-40 transition"
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
                Downloaded with all text, highlights, and drawings cleanly embedded into PDF structure.
                {resultBytes && ` Output size: ${formatBytes(resultBytes)}.`}
              </p>
            </div>
          </div>
          <button
            type="button"
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
