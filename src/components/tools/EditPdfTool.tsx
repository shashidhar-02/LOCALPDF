'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Type,
  Eraser,
  PenTool,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Highlighter,
  Image as ImageIcon,
  Stamp,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Move,
  Bold,
  Italic,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyPdfEdits, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { PdfEditItem, PdfEditItemType, StandardFontFamily } from '@/lib/types';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  renderPageThumbnail,
  getCachedPageRender,
  setCachedPageRender
} from '@/lib/pdf-viewer-helper';

const PRESET_STAMPS = [
  { label: 'APPROVED', color: '#16a34a', bg: '#dcfce7' },
  { label: 'CONFIDENTIAL', color: '#dc2626', bg: '#fee2e2' },
  { label: 'DRAFT', color: '#475569', bg: '#f1f5f9' },
  { label: 'PAID', color: '#2563eb', bg: '#dbeafe' },
  { label: 'VOID', color: '#991b1b', bg: '#fef2f2' },
];

export default function EditPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [docId, setDocId] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<PdfEditItemType | 'select'>('text');

  // Text / Font Styling
  const [fontFamily, setFontFamily] = useState<StandardFontFamily>('Helvetica');
  const [fontSize, setFontSize] = useState<number>(14);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [whiteoutBgColor, setWhiteoutBgColor] = useState<string>('#ffffff');

  // Shape / Stroke Styling
  const [strokeColor, setStrokeColor] = useState<string>('#2563eb');
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1.0);

  // Edits State & Undo/Redo History Stack
  const [edits, setEdits] = useState<PdfEditItem[]>([]);
  const [history, setHistory] = useState<PdfEditItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Canvas interaction refs
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<{ x: number; y: number } | null>(null);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  // Dragging / Moving an existing item
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Processing & Download state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

  // Hidden Image File Input
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to push history for undo/redo
  const recordHistory = useCallback((newEdits: PdfEditItem[]) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newEdits];
    });
    setHistoryIndex((prev) => prev + 1);
    setEdits(newEdits);
  }, [historyIndex]);

  // Load PDF file
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setSuccess(false);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const pages = await getPDFPageCount(bytes);
      const loadedDoc = await loadPdfDocument(bytes);
      const randomDocId = `${selected.name}_${selected.size}_${Date.now()}`;

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(pages);
      setPdfDoc(loadedDoc);
      setDocId(randomDocId);
      setCurrentPage(1);
      setEdits([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedItemId(null);

      // Asynchronously pre-generate thumbnails for sidebar
      generateThumbnails(loadedDoc, pages);
    } catch {
      setError('Could not read PDF. File may be password-protected or corrupt.');
    }
  };

  const generateThumbnails = async (loadedDoc: any, pages: number) => {
    const thumbMap: { [page: number]: string } = {};
    const limit = Math.min(pages, 15);
    for (let i = 1; i <= limit; i++) {
      try {
        const thumbUrl = await renderPageThumbnail(loadedDoc, i, 120);
        thumbMap[i] = thumbUrl;
        setThumbnails((prev) => ({ ...prev, [i]: thumbUrl }));
      } catch {
        // Thumbnail generation error ignored
      }
    }
  };

  // Render current page onto canvas with high-performance caching
  useEffect(() => {
    let isCancelled = false;
    if (!pdfDoc || !pageCanvasRef.current) return;

    const canvas = pageCanvasRef.current;
    const cached = getCachedPageRender(docId, currentPage, scale);

    if (cached) {
      // Rapid cache hit: render in 0ms!
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

    // Cache miss: render via PDF.js
    setIsRenderingPage(true);
    renderPdfPageToCanvas(pdfDoc, currentPage, canvas, scale)
      .then(() => {
        if (isCancelled) return;
        // Save to LRU cache
        const dataUrl = canvas.toDataURL('image/png');
        setCachedPageRender(docId, currentPage, scale, {
          canvasDataUrl: dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      })
      .catch((err) => {
        if (!isCancelled) console.error('Page render error:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsRenderingPage(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, docId]);

  // Convert client viewport coordinates to PDF points (1/72 inch)
  const getRelativePdfPoint = (clientX: number, clientY: number) => {
    if (!pageCanvasRef.current) return { x: 0, y: 0 };
    const rect = pageCanvasRef.current.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const canvasCssWidth = pageCanvasRef.current.width / pixelRatio;
    const scaleFactor = canvasCssWidth > 0 ? (pageCanvasRef.current.width / pixelRatio) / (rect.width) : 1;

    // Relative to canvas in PDF points (scale adjusted)
    const relX = (clientX - rect.left) / scale;
    const relY = (clientY - rect.top) / scale;
    return { x: Math.round(relX), y: Math.round(relY) };
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevEdits = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setEdits(prevEdits);
      setSelectedItemId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextEdits = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setEdits(nextEdits);
      setSelectedItemId(null);
    }
  };

  // Canvas Click / Mouse Down Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!pageCanvasRef.current) return;
    const pt = getRelativePdfPoint(e.clientX, e.clientY);

    if (activeTool === 'select') {
      // Check if clicked outside of any item to deselect
      return;
    }

    if (activeTool === 'freehand') {
      setIsInteracting(true);
      setCurrentFreehandPoints([pt]);
      return;
    }

    if (activeTool === 'text') {
      const newItem: PdfEditItem = {
        id: `text_${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x: pt.x,
        y: pt.y,
        width: 140,
        height: 28,
        text: 'Type text here',
        fontFamily,
        fontSize,
        textColor,
        bold: isBold,
        italic: isItalic,
        opacity: 1.0,
      };
      recordHistory([...edits, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'whiteout') {
      setIsInteracting(true);
      setInteractionStart(pt);
      return;
    }

    if (['rectangle', 'circle', 'line', 'arrow', 'highlight'].includes(activeTool)) {
      setIsInteracting(true);
      setInteractionStart(pt);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    const pt = getRelativePdfPoint(e.clientX, e.clientY);

    if (activeTool === 'freehand') {
      setCurrentFreehandPoints((prev) => [...prev, pt]);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    setIsInteracting(false);
    const endPt = getRelativePdfPoint(e.clientX, e.clientY);

    if (activeTool === 'freehand' && currentFreehandPoints.length > 1) {
      const minX = Math.min(...currentFreehandPoints.map((p) => p.x));
      const minY = Math.min(...currentFreehandPoints.map((p) => p.y));
      const maxX = Math.max(...currentFreehandPoints.map((p) => p.x));
      const maxY = Math.max(...currentFreehandPoints.map((p) => p.y));

      const newItem: PdfEditItem = {
        id: `draw_${Date.now()}`,
        type: 'freehand',
        pageNumber: currentPage,
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        strokeColor,
        strokeWidth,
        opacity,
        points: currentFreehandPoints,
      };
      recordHistory([...edits, newItem]);
      setCurrentFreehandPoints([]);
      return;
    }

    if (interactionStart) {
      const width = Math.max(20, Math.abs(endPt.x - interactionStart.x));
      const height = Math.max(16, Math.abs(endPt.y - interactionStart.y));
      const x = Math.min(interactionStart.x, endPt.x);
      const y = Math.min(interactionStart.y, endPt.y);

      if (activeTool === 'whiteout') {
        const newItem: PdfEditItem = {
          id: `whiteout_${Date.now()}`,
          type: 'whiteout',
          pageNumber: currentPage,
          x,
          y,
          width,
          height,
          backgroundColor: whiteoutBgColor,
          text: '',
          fontFamily,
          fontSize,
          textColor,
          bold: isBold,
          italic: isItalic,
          opacity: 1.0,
        };
        recordHistory([...edits, newItem]);
        setSelectedItemId(newItem.id);
        setActiveTool('select');
      } else if (activeTool === 'highlight') {
        const newItem: PdfEditItem = {
          id: `high_${Date.now()}`,
          type: 'highlight',
          pageNumber: currentPage,
          x,
          y,
          width,
          height,
          backgroundColor: '#fef08a',
          opacity: 0.35,
        };
        recordHistory([...edits, newItem]);
        setSelectedItemId(newItem.id);
        setActiveTool('select');
      } else if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)) {
        const newItem: PdfEditItem = {
          id: `${activeTool}_${Date.now()}`,
          type: activeTool as PdfEditItemType,
          pageNumber: currentPage,
          x,
          y,
          width,
          height,
          strokeColor,
          strokeWidth,
          fillColor: fillColor !== 'transparent' ? fillColor : undefined,
          opacity,
        };
        recordHistory([...edits, newItem]);
        setSelectedItemId(newItem.id);
        setActiveTool('select');
      }
    }

    setInteractionStart(null);
  };

  // Add Stamp
  const handleAddStamp = (stampText: string, color: string, bg: string) => {
    const newItem: PdfEditItem = {
      id: `stamp_${Date.now()}`,
      type: 'whiteout',
      pageNumber: currentPage,
      x: 80,
      y: 100,
      width: 160,
      height: 44,
      backgroundColor: bg,
      text: stampText,
      fontFamily: 'Helvetica',
      fontSize: 16,
      textColor: color,
      bold: true,
      italic: false,
      opacity: 0.95,
    };
    recordHistory([...edits, newItem]);
    setSelectedItemId(newItem.id);
    setActiveTool('select');
  };

  // Upload Custom Image/Logo
  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const imgFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newItem: PdfEditItem = {
        id: `img_${Date.now()}`,
        type: 'image',
        pageNumber: currentPage,
        x: 100,
        y: 120,
        width: 140,
        height: 100,
        dataUrl,
        opacity: 1.0,
      };
      recordHistory([...edits, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    };
    reader.readAsDataURL(imgFile);
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    const newEdits = edits.filter((it) => it.id !== selectedItemId);
    recordHistory(newEdits);
    setSelectedItemId(null);
  };

  // Update properties of selected item
  const updateSelectedItem = (props: Partial<PdfEditItem>) => {
    if (!selectedItemId) return;
    const newEdits = edits.map((it) => (it.id === selectedItemId ? { ...it, ...props } : it));
    recordHistory(newEdits);
  };

  // Keyboard shortcut listener for Delete and Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
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
  }, [selectedItemId, edits, historyIndex, history]);

  // Export & Download Edited PDF
  const handleDownloadEditedPdf = async () => {
    if (!fileBytes || edits.length === 0) return;
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const outputBytes = await applyPdfEdits(fileBytes, edits);
      const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'document';
      downloadFile(outputBytes, `${baseName}-edited.pdf`, 'application/pdf');
      setResultBytes(outputBytes.byteLength);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate edited PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedItem = edits.find((it) => it.id === selectedItemId);
  const currentPageEdits = edits.filter((it) => it.pageNumber === currentPage);

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Choose a PDF file to edit"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Top Bar: Title & Primary Actions */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
                <Type className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatBytes(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {edits.length} {edits.length === 1 ? 'edit' : 'edits'}
                </p>
              </div>
            </div>

            {/* Quick Actions: Undo, Redo, Zoom, Download */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

              <div className="hidden sm:flex items-center space-x-1 bg-slate-800 rounded-lg px-2 py-1">
                <button
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                  className="p-1 hover:text-sky-400 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 hover:text-sky-400 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleDownloadEditedPdf}
                disabled={isExporting}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Edits...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Tool Selection Toolbar */}
          <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTool('select')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'select'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Select and reposition elements"
              >
                <Move className="w-4 h-4" />
                <span>Select</span>
              </button>

              <button
                onClick={() => setActiveTool('text')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'text'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Add new text box"
              >
                <Type className="w-4 h-4" />
                <span>Add Text</span>
              </button>

              <button
                onClick={() => setActiveTool('whiteout')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'whiteout'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Erase or replace original text with matching font"
              >
                <Eraser className="w-4 h-4" />
                <span>Erase / Replace</span>
              </button>

              <button
                onClick={() => setActiveTool('highlight')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'highlight'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Highlight text"
              >
                <Highlighter className="w-4 h-4" />
                <span>Highlight</span>
              </button>

              <button
                onClick={() => setActiveTool('freehand')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'freehand'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Draw freehand"
              >
                <PenTool className="w-4 h-4" />
                <span>Draw</span>
              </button>

              <button
                onClick={() => setActiveTool('rectangle')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'rectangle'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Draw rectangle"
              >
                <Square className="w-4 h-4" />
                <span>Box</span>
              </button>

              <button
                onClick={() => setActiveTool('circle')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'circle'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Draw circle"
              >
                <Circle className="w-4 h-4" />
                <span>Circle</span>
              </button>

              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium bg-white hover:bg-slate-200 text-slate-700 transition-all"
                title="Insert PNG or JPG image"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Insert Image</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageUploaded}
              />
            </div>

            {/* Quick Stamps Dropdown / Buttons */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Stamp className="w-3.5 h-3.5" />
                <span>Stamps:</span>
              </span>
              {PRESET_STAMPS.map((st) => (
                <button
                  key={st.label}
                  onClick={() => handleAddStamp(st.label, st.color, st.bg)}
                  style={{ color: st.color, borderColor: st.color }}
                  className="px-2 py-0.5 text-xs font-black rounded border border-dashed hover:scale-105 active:scale-95 transition-transform"
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context-Sensitive Property Inspector Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            {/* Font Family selector */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Font:</span>
              <select
                value={selectedItem?.fontFamily || fontFamily}
                onChange={(e) => {
                  const val = e.target.value as StandardFontFamily;
                  setFontFamily(val);
                  if (selectedItem) updateSelectedItem({ fontFamily: val });
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-sans focus:outline-sky-500"
              >
                <option value="Helvetica">Helvetica / Arial (Standard)</option>
                <option value="Times-Roman">Times New Roman (Serif)</option>
                <option value="Courier">Courier (Monospace)</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Size:</span>
              <select
                value={selectedItem?.fontSize || fontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFontSize(val);
                  if (selectedItem) updateSelectedItem({ fontSize: val });
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-sky-500"
              >
                {[9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} pt
                  </option>
                ))}
              </select>
            </div>

            {/* Bold / Italic */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const next = !((selectedItem ? selectedItem.bold : isBold));
                  setIsBold(next);
                  if (selectedItem) updateSelectedItem({ bold: next });
                }}
                className={`p-1.5 rounded border ${
                  (selectedItem?.bold ?? isBold)
                    ? 'bg-sky-100 border-sky-400 text-sky-800'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const next = !((selectedItem ? selectedItem.italic : isItalic));
                  setIsItalic(next);
                  if (selectedItem) updateSelectedItem({ italic: next });
                }}
                className={`p-1.5 rounded border ${
                  (selectedItem?.italic ?? isItalic)
                    ? 'bg-sky-100 border-sky-400 text-sky-800'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Color Presets */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Color:</span>
              {['#0f172a', '#dc2626', '#16a34a', '#2563eb', '#ca8a04', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setTextColor(c);
                    if (selectedItem) updateSelectedItem({ textColor: c, strokeColor: c });
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border ${
                    (selectedItem?.textColor || textColor) === c ? 'ring-2 ring-sky-500' : 'border-slate-300'
                  }`}
                />
              ))}
              <input
                type="color"
                value={selectedItem?.textColor || textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  if (selectedItem) updateSelectedItem({ textColor: e.target.value, strokeColor: e.target.value });
                }}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>

            {/* Delete button if an item is selected */}
            {selectedItem && (
              <div className="ml-auto flex items-center space-x-2">
                <span className="text-xs text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Item Selected ({selectedItem.type})
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium transition-colors"
                  title="Delete element (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Editing Area: Left Thumbnail Sidebar + Right Interactive Canvas */}
          <div className="flex-1 flex overflow-hidden min-h-[600px] bg-slate-200">
            {/* Thumbnail Navigator */}
            <div className="w-40 sm:w-48 bg-slate-100 border-r border-slate-200 p-3 overflow-y-auto space-y-3 shrink-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pages ({totalPages})
              </p>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const pageEditsCount = edits.filter((it) => it.pageNumber === pageNum).length;
                const isSelected = currentPage === pageNum;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-full text-left p-2 rounded-xl transition-all relative ${
                      isSelected
                        ? 'bg-sky-500/10 border-2 border-sky-600 shadow-sm'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-slate-50 rounded overflow-hidden flex items-center justify-center border border-slate-100">
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
                      <span className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-600'}`}>
                        Page {pageNum}
                      </span>
                      {pageEditsCount > 0 && (
                        <span className="bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {pageEditsCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Central Canvas Workspace */}
            <div
              ref={containerRef}
              className="flex-1 p-6 overflow-auto flex items-center justify-center relative select-none"
              onClick={() => {
                if (activeTool === 'select') setSelectedItemId(null);
              }}
            >
              {isRenderingPage && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center z-20">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Rendering Page {currentPage}...</span>
                  </div>
                </div>
              )}

              {/* PDF Canvas Container */}
              <div
                className="relative shadow-2xl bg-white border border-slate-300 cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              >
                {/* PDF.js Page Render Canvas */}
                <canvas ref={pageCanvasRef} className="block pointer-events-none" />

                {/* Interactive SVG/DOM Editing Layer Over Canvas */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Freehand preview path while drawing */}
                  {currentFreehandPoints.length > 1 && (
                    <svg className="w-full h-full absolute inset-0">
                      <polyline
                        points={currentFreehandPoints.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* Render current page edits */}
                  {currentPageEdits.map((item) => {
                    const isSelected = item.id === selectedItemId;
                    const itemStyle: React.CSSProperties = {
                      position: 'absolute',
                      left: `${item.x * scale}px`,
                      top: `${item.y * scale}px`,
                      width: `${item.width * scale}px`,
                      height: `${item.height * scale}px`,
                      pointerEvents: 'auto',
                    };

                    return (
                      <div
                        key={item.id}
                        style={itemStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item.id);
                        }}
                        className={`group cursor-move transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-sky-500 ring-offset-1 rounded'
                            : 'hover:ring-1 hover:ring-sky-300'
                        }`}
                      >
                        {/* Whiteout / Text Eraser Block */}
                        {item.type === 'whiteout' && (
                          <div
                            style={{
                              backgroundColor: item.backgroundColor || '#ffffff',
                              width: '100%',
                              height: '100%',
                              opacity: item.opacity ?? 1,
                            }}
                            className="relative flex items-center justify-start overflow-hidden px-1 rounded-xs"
                          >
                            <input
                              type="text"
                              value={item.text || ''}
                              placeholder="Type replacement text..."
                              onChange={(e) => updateSelectedItem({ text: e.target.value })}
                              style={{
                                color: item.textColor || '#000000',
                                fontSize: `${(item.fontSize || 12) * scale}px`,
                                fontFamily: item.fontFamily === 'Courier' ? 'monospace' : item.fontFamily === 'Times-Roman' ? 'serif' : 'sans-serif',
                                fontWeight: item.bold ? 'bold' : 'normal',
                                fontStyle: item.italic ? 'italic' : 'normal',
                              }}
                              className="w-full bg-transparent border-0 outline-none p-0"
                            />
                          </div>
                        )}

                        {/* Text Block */}
                        {item.type === 'text' && (
                          <div
                            style={{
                              backgroundColor: item.backgroundColor || 'transparent',
                              color: item.textColor || '#0f172a',
                              fontSize: `${(item.fontSize || 14) * scale}px`,
                              fontFamily: item.fontFamily === 'Courier' ? 'monospace' : item.fontFamily === 'Times-Roman' ? 'serif' : 'sans-serif',
                              fontWeight: item.bold ? 'bold' : 'normal',
                              fontStyle: item.italic ? 'italic' : 'normal',
                              lineHeight: 1.25,
                            }}
                            className="w-full h-full flex items-start overflow-hidden p-0.5"
                          >
                            <textarea
                              value={item.text || ''}
                              onChange={(e) => updateSelectedItem({ text: e.target.value })}
                              className="w-full h-full bg-transparent resize-none border-0 outline-none p-0 font-inherit text-inherit"
                            />
                          </div>
                        )}

                        {/* Shape: Rectangle */}
                        {item.type === 'rectangle' && (
                          <div
                            style={{
                              borderColor: item.strokeColor || '#2563eb',
                              borderWidth: `${(item.strokeWidth || 2)}px`,
                              borderStyle: 'solid',
                              backgroundColor: item.fillColor || 'transparent',
                              opacity: item.opacity ?? 1,
                            }}
                            className="w-full h-full"
                          />
                        )}

                        {/* Shape: Circle */}
                        {item.type === 'circle' && (
                          <div
                            style={{
                              borderColor: item.strokeColor || '#2563eb',
                              borderWidth: `${(item.strokeWidth || 2)}px`,
                              borderStyle: 'solid',
                              backgroundColor: item.fillColor || 'transparent',
                              opacity: item.opacity ?? 1,
                              borderRadius: '50%',
                            }}
                            className="w-full h-full"
                          />
                        )}

                        {/* Highlight */}
                        {item.type === 'highlight' && (
                          <div
                            style={{
                              backgroundColor: item.backgroundColor || '#facc15',
                              opacity: item.opacity ?? 0.35,
                            }}
                            className="w-full h-full rounded"
                          />
                        )}

                        {/* Image / Stamp */}
                        {(item.type === 'image' || item.type === 'stamp') && item.dataUrl && (
                          <img
                            src={item.dataUrl}
                            alt="Edit insertion"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}

                        {/* Freehand rendering */}
                        {item.type === 'freehand' && item.points && (
                          <svg className="w-full h-full overflow-visible">
                            <polyline
                              points={item.points.map((p) => `${(p.x - item.x) * scale},${(p.y - item.y) * scale}`).join(' ')}
                              fill="none"
                              stroke={item.strokeColor || '#0f172a'}
                              strokeWidth={item.strokeWidth || 2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}

                        {/* Selection border and delete button */}
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSelected();
                            }}
                            className="absolute -top-3 -right-3 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors pointer-events-auto"
                            title="Delete"
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
          </div>

          {/* Footer Bar: Privacy Status & Navigation */}
          <div className="p-3 bg-slate-900 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Server Guarantee: All edits rendered directly in local WebAssembly memory</span>
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">PDF Edited Successfully!</p>
              <p className="text-xs text-emerald-700">
                Downloaded with all text, font styles, whiteouts, and stamps cleanly embedded.
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
