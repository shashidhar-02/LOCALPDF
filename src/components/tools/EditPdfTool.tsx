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
  Highlighter,
  Image as ImageIcon,
  Stamp,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Bold,
  Italic,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RotateCw,
  Copy,
  PlusCircle,
  FilePlus,
  Hash,
  Droplet,
  Layers
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import {
  applyPdfEdits,
  getPDFPageCount,
  rotatePageInPdf,
  deletePageInPdf,
  duplicatePageInPdf,
  insertBlankPageInPdf,
  addWatermarkToDocument,
  addPageNumbersToDocument
} from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import {
  PdfEditItem,
  PdfEditItemType,
  StandardFontFamily,
  DetectedPdfTextItem
} from '@/lib/types';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  renderPageThumbnail,
  getCachedPageRender,
  setCachedPageRender,
  clearRenderCache,
  extractPageTextItems
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
  const [activeTool, setActiveTool] = useState<PdfEditItemType | 'select' | 'detect-text'>('select');

  // Adobe Pro Mode: Detected text blocks on current page
  const [detectedTexts, setDetectedTexts] = useState<DetectedPdfTextItem[]>([]);
  const [isDetectingText, setIsDetectingText] = useState<boolean>(false);
  const [showDetectedOverlay, setShowDetectedOverlay] = useState<boolean>(false);

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

  // Redaction custom label
  const [redactionLabel, setRedactionLabel] = useState<string>('[REDACTED]');

  // Modals for Adobe Enterprise Features
  const [showWatermarkModal, setShowWatermarkModal] = useState<boolean>(false);
  const [watermarkInput, setWatermarkInput] = useState<string>('CONFIDENTIAL');
  const [showPageNumbersModal, setShowPageNumbersModal] = useState<boolean>(false);
  const [pageNumberPrefix, setPageNumberPrefix] = useState<string>('Page ');
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  // Edits State & Undo/Redo History Stack
  const [edits, setEdits] = useState<PdfEditItem[]>([]);
  const [history, setHistory] = useState<PdfEditItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Canvas interaction refs
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<{ x: number; y: number } | null>(null);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  // Processing & Download state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPageOperating, setIsPageOperating] = useState<boolean>(false);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<number | null>(null);

  // Hidden Image File Input
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Push history for undo/redo
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
      await initializePdfState(selected, bytes);
    } catch {
      setError('Could not read PDF. File may be password-protected or corrupt.');
    }
  };

  const initializePdfState = async (selected: File, bytes: Uint8Array) => {
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
    clearRenderCache();

    generateThumbnails(loadedDoc, pages);
  };

  const generateThumbnails = async (loadedDoc: any, pages: number) => {
    const thumbMap: { [page: number]: string } = {};
    const limit = Math.min(pages, 20);
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
        if (!isCancelled) console.error('Page render error:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsRenderingPage(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, docId]);

  // Adobe Pro Text Detection: scan current page for existing text items
  const handleToggleDetectText = async () => {
    if (showDetectedOverlay) {
      setShowDetectedOverlay(false);
      return;
    }

    if (!pdfDoc) return;
    setIsDetectingText(true);
    try {
      const items = await extractPageTextItems(pdfDoc, currentPage);
      setDetectedTexts(items);
      setShowDetectedOverlay(true);
      setActiveTool('detect-text');
    } catch {
      setError('Could not extract text structure for editing.');
    } finally {
      setIsDetectingText(false);
    }
  };

  // Convert client viewport coordinates to PDF points (1/72 inch)
  const getRelativePdfPoint = (clientX: number, clientY: number) => {
    if (!pageCanvasRef.current) return { x: 0, y: 0 };
    const rect = pageCanvasRef.current.getBoundingClientRect();
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

  // When clicking an auto-detected text block: Adobe Acrobat-style in-place edit!
  const handleSelectDetectedText = (dt: DetectedPdfTextItem) => {
    // Create an in-place whiteout box pre-populated with original text and matched font style
    const newItem: PdfEditItem = {
      id: `edit_text_${Date.now()}`,
      type: 'whiteout',
      pageNumber: currentPage,
      x: dt.x - 2,
      y: dt.y - 2,
      width: Math.max(30, dt.width + 6),
      height: Math.max(16, dt.height + 4),
      backgroundColor: '#ffffff',
      text: dt.str,
      fontFamily: dt.fontFamily,
      fontSize: dt.fontSize,
      textColor: '#0f172a',
      bold: false,
      italic: false,
      opacity: 1.0,
    };

    recordHistory([...edits, newItem]);
    setSelectedItemId(newItem.id);
    setActiveTool('select');
    setShowDetectedOverlay(false);
  };

  // Canvas Click / Mouse Down Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!pageCanvasRef.current) return;
    const pt = getRelativePdfPoint(e.clientX, e.clientY);

    if (activeTool === 'select' || activeTool === 'detect-text') return;

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

    if (['whiteout', 'redaction', 'rectangle', 'circle', 'line', 'arrow', 'highlight'].includes(activeTool)) {
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
      const width = Math.max(18, Math.abs(endPt.x - interactionStart.x));
      const height = Math.max(14, Math.abs(endPt.y - interactionStart.y));
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
      } else if (activeTool === 'redaction') {
        const newItem: PdfEditItem = {
          id: `redact_${Date.now()}`,
          type: 'redaction',
          pageNumber: currentPage,
          x,
          y,
          width,
          height,
          backgroundColor: '#000000',
          text: redactionLabel,
          textColor: '#ffffff',
          fontFamily: 'Helvetica',
          fontSize: 9,
          bold: true,
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

  // Duplicate selected item (Ctrl+D)
  const handleDuplicateSelected = () => {
    if (!selectedItemId) return;
    const item = edits.find((it) => it.id === selectedItemId);
    if (!item) return;
    const duplicated: PdfEditItem = {
      ...item,
      id: `${item.type}_${Date.now()}`,
      x: item.x + 15,
      y: item.y + 15,
    };
    recordHistory([...edits, duplicated]);
    setSelectedItemId(duplicated.id);
  };

  // Update properties of selected item
  const updateSelectedItem = (props: Partial<PdfEditItem>) => {
    if (!selectedItemId) return;
    const newEdits = edits.map((it) => (it.id === selectedItemId ? { ...it, ...props } : it));
    recordHistory(newEdits);
  };

  // Nudge item via keyboard arrows
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (!selectedItemId) return;
    const item = edits.find((it) => it.id === selectedItemId);
    if (!item) return;
    updateSelectedItem({
      x: Math.max(0, item.x + deltaX),
      y: Math.max(0, item.y + deltaY),
    });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement).tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') handleNudge(0, -step);
        if (e.key === 'ArrowDown') handleNudge(0, step);
        if (e.key === 'ArrowLeft') handleNudge(-step, 0);
        if (e.key === 'ArrowRight') handleNudge(step, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, edits, historyIndex, history]);

  // Adobe Page Operations: Rotate Page
  const handleRotateCurrentPage = async (angle: number) => {
    if (!fileBytes) return;
    setIsPageOperating(true);
    try {
      const newBytes = await rotatePageInPdf(fileBytes, currentPage, angle);
      await refreshPdfBytes(newBytes, `Rotated Page ${currentPage} by ${angle}°`);
    } catch {
      setError('Failed to rotate page.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Adobe Page Operations: Delete Page
  const handleDeleteCurrentPage = async () => {
    if (!fileBytes || totalPages <= 1) return;
    if (!confirm(`Are you sure you want to permanently delete Page ${currentPage}?`)) return;

    setIsPageOperating(true);
    try {
      const newBytes = await deletePageInPdf(fileBytes, currentPage);
      const nextTargetPage = Math.max(1, currentPage - 1);
      await refreshPdfBytes(newBytes, `Page ${currentPage} deleted`, nextTargetPage);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete page.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Adobe Page Operations: Duplicate Page
  const handleDuplicateCurrentPage = async () => {
    if (!fileBytes) return;
    setIsPageOperating(true);
    try {
      const newBytes = await duplicatePageInPdf(fileBytes, currentPage);
      await refreshPdfBytes(newBytes, `Duplicated Page ${currentPage}`);
    } catch {
      setError('Failed to duplicate page.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Adobe Page Operations: Add Blank Page
  const handleAddBlankPage = async () => {
    if (!fileBytes) return;
    setIsPageOperating(true);
    try {
      const newBytes = await insertBlankPageInPdf(fileBytes, currentPage);
      await refreshPdfBytes(newBytes, `Inserted blank page after Page ${currentPage}`, currentPage + 1);
    } catch {
      setError('Failed to insert blank page.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Adobe Watermark Generator: Apply to Document
  const handleApplyWatermark = async () => {
    if (!fileBytes || !watermarkInput.trim()) return;
    setIsPageOperating(true);
    setShowWatermarkModal(false);
    try {
      const newBytes = await addWatermarkToDocument(fileBytes, watermarkInput.trim(), 0.18);
      await refreshPdfBytes(newBytes, `Applied watermark "${watermarkInput}" across all pages`);
    } catch {
      setError('Failed to apply watermark.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Adobe Page Numbers: Apply to Document
  const handleApplyPageNumbers = async () => {
    if (!fileBytes) return;
    setIsPageOperating(true);
    setShowPageNumbersModal(false);
    try {
      const newBytes = await addPageNumbersToDocument(fileBytes, pageNumberPosition, pageNumberPrefix);
      await refreshPdfBytes(newBytes, `Applied page numbering across document`);
    } catch {
      setError('Failed to apply page numbering.');
    } finally {
      setIsPageOperating(false);
    }
  };

  // Refresh PDF document bytes in-place
  const refreshPdfBytes = async (newBytes: Uint8Array, message: string, targetPage?: number) => {
    clearRenderCache();
    const newDoc = await loadPdfDocument(newBytes);
    const count = await getPDFPageCount(newBytes);
    const newId = `${docId}_mod_${Date.now()}`;

    setFileBytes(newBytes);
    setPdfDoc(newDoc);
    setTotalPages(count);
    setDocId(newId);
    if (targetPage) setCurrentPage(targetPage);
    generateThumbnails(newDoc, count);

    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Export & Download Edited PDF
  const handleDownloadEditedPdf = async () => {
    if (!fileBytes) return;
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
          acceptLabel="Choose a PDF to edit with Adobe Pro-level tools"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Top Bar: Title & Primary Enterprise Actions */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-gradient-to-br from-indigo-500 to-sky-500 text-white rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm sm:text-base leading-tight truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Pro Tools Free
                  </span>
                </div>
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
                disabled={isExporting || isPageOperating}
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

          {/* Adobe Acrobat Pro Tools Bar */}
          <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            {/* Primary Edit Modes */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTool('select')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'select'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
                title="Select, move, and edit elements"
              >
                <Move className="w-4 h-4" />
                <span>Select</span>
              </button>

              {/* Adobe Pro Feature: Click to Edit Existing Text */}
              <button
                onClick={handleToggleDetectText}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  showDetectedOverlay
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
                title="Auto-detect and click to edit any existing text on this page directly"
              >
                {isDetectingText ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Edit Existing Text (Acrobat Mode)</span>
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

              {/* Adobe Legal Redaction Tool */}
              <button
                onClick={() => setActiveTool('redaction')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTool === 'redaction'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-900'
                }`}
                title="Permanent Legal Redaction Blackout"
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Redact</span>
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
                title="Freehand markup"
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
                title="Draw rectangle box"
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

            {/* Document-level Adobe Tools: Watermark & Page Numbers */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowWatermarkModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                title="Add watermark across all pages"
              >
                <Droplet className="w-3.5 h-3.5 text-sky-600" />
                <span>Watermark</span>
              </button>

              <button
                onClick={() => setShowPageNumbersModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                title="Add page numbers or Bates labels"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>Page Numbers</span>
              </button>
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

            {/* Redaction label input if redaction active */}
            {activeTool === 'redaction' && (
              <div className="flex items-center space-x-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <span className="text-red-700 font-medium">Label:</span>
                <input
                  type="text"
                  value={redactionLabel}
                  onChange={(e) => setRedactionLabel(e.target.value)}
                  placeholder="[REDACTED]"
                  className="w-24 bg-white border border-red-300 rounded px-1.5 py-0.5 text-xs text-red-800"
                />
              </div>
            )}

            {/* Action buttons if item selected */}
            {selectedItem && (
              <div className="ml-auto flex items-center space-x-2">
                <button
                  onClick={handleDuplicateSelected}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-colors"
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
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

          {/* Main Editing Area: Left Sidebar (Page tools + Thumbnails) + Right Canvas */}
          <div className="flex-1 flex overflow-hidden min-h-[620px] bg-slate-200">
            {/* Sidebar with Adobe Page-level management */}
            <div className="w-44 sm:w-52 bg-slate-100 border-r border-slate-200 p-3 overflow-y-auto space-y-3 shrink-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pages ({totalPages})
                  </span>
                  <button
                    onClick={handleAddBlankPage}
                    className="p-1 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded"
                    title="Insert blank page"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
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
              </div>

              {/* In-Editor Page Management Panel */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Page {currentPage} Actions
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleRotateCurrentPage(90)}
                    disabled={isPageOperating}
                    className="flex items-center justify-center space-x-1 p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700"
                    title="Rotate page 90 degrees clockwise"
                  >
                    <RotateCw className="w-3 h-3 text-sky-600" />
                    <span>Rotate</span>
                  </button>
                  <button
                    onClick={handleDuplicateCurrentPage}
                    disabled={isPageOperating}
                    className="flex items-center justify-center space-x-1 p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700"
                    title="Duplicate current page"
                  >
                    <Copy className="w-3 h-3 text-indigo-600" />
                    <span>Clone</span>
                  </button>
                  <button
                    onClick={handleDeleteCurrentPage}
                    disabled={isPageOperating || totalPages <= 1}
                    className="col-span-2 flex items-center justify-center space-x-1 p-1.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded text-[11px] font-semibold text-red-700 disabled:opacity-40"
                    title="Delete page from document"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Page</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Central Canvas Workspace */}
            <div
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

              {/* Status popup banner */}
              {statusMessage && (
                <div className="absolute top-4 z-30 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg animate-fade-in flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{statusMessage}</span>
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

                {/* Adobe Pro Feature: Detected Text Hover Blocks */}
                {showDetectedOverlay && (
                  <div className="absolute inset-0 pointer-events-auto bg-indigo-50/15">
                    {detectedTexts.map((dt) => (
                      <div
                        key={dt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDetectedText(dt);
                        }}
                        style={{
                          left: `${dt.x * scale}px`,
                          top: `${dt.y * scale}px`,
                          width: `${dt.width * scale}px`,
                          height: `${dt.height * scale}px`,
                        }}
                        className="absolute border border-indigo-400/60 bg-indigo-500/10 hover:bg-indigo-500/30 hover:border-indigo-600 cursor-pointer rounded-xs transition-colors flex items-center justify-center group"
                        title={`Click to edit: "${dt.str}"`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[9px] bg-indigo-900 text-white px-1 rounded absolute -top-4 pointer-events-none whitespace-nowrap z-30">
                          Edit text
                        </span>
                      </div>
                    ))}
                  </div>
                )}

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

                        {/* Redaction Blackout Block */}
                        {item.type === 'redaction' && (
                          <div
                            style={{
                              backgroundColor: '#000000',
                              width: '100%',
                              height: '100%',
                            }}
                            className="relative flex items-center justify-center overflow-hidden px-1"
                          >
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                              {item.text || '[REDACTED]'}
                            </span>
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
              <span>Zero-Server Guarantee: Adobe Pro-level editing performed entirely in client memory</span>
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

      {/* Watermark Dialog Modal */}
      {showWatermarkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-sky-600" />
                <span>Document Watermark</span>
              </h4>
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Watermark Text:
                </label>
                <input
                  type="text"
                  value={watermarkInput}
                  onChange={(e) => setWatermarkInput(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'INTERNAL'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setWatermarkInput(preset)}
                    className="px-2 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 text-xs font-semibold rounded"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyWatermark}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
              >
                Apply Across All Pages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Numbers Dialog Modal */}
      {showPageNumbersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 flex items-center space-x-2">
                <Hash className="w-5 h-5 text-indigo-600" />
                <span>Bates Numbering / Page Numbers</span>
              </h4>
              <button
                onClick={() => setShowPageNumbersModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Prefix / Format:
                </label>
                <input
                  type="text"
                  value={pageNumberPrefix}
                  onChange={(e) => setPageNumberPrefix(e.target.value)}
                  placeholder="e.g. Page "
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-sky-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Preview: &quot;{pageNumberPrefix}1 of {totalPages || 5}&quot;
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Position:
                </label>
                <select
                  value={pageNumberPosition}
                  onChange={(e: any) => setPageNumberPosition(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-sky-500"
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowPageNumbersModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPageNumbers}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Apply Page Numbers
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
              <p className="font-bold text-sm">PDF Saved & Downloaded Successfully!</p>
              <p className="text-xs text-emerald-700">
                All Adobe-level in-place text edits, redactions, page modifications, and fonts were permanently saved.
                {resultBytes && ` Output file size: ${formatBytes(resultBytes)}.`}
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
