'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, Type, Highlighter, Square, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyVisualAnnotations, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { VisualAnnotation } from '@/lib/types';
import { loadPdfDocument, renderPdfPageToCanvas } from '@/lib/pdf-viewer-helper';

export default function AnnotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Annotation Tool state
  const [toolType, setToolType] = useState<'text' | 'highlight' | 'rectangle' | 'strike'>('text');
  const [textInput, setTextInput] = useState('Note text');
  const [color, setColor] = useState('#facc15'); // default yellow
  const [fontSize, setFontSize] = useState(14);
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(pages);
      setPdfDoc(loadedDoc);
      setCurrentPage(1);
    } catch (err: any) {
      setError('Could not read PDF. File may be corrupt or encrypted.');
    }
  };

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, 1.0).catch(console.error);
    }
  }, [pdfDoc, currentPage]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const newAnn: VisualAnnotation = {
      id: `ann-${Date.now()}`,
      type: toolType,
      pageNumber: currentPage,
      x,
      y,
      color,
      text: toolType === 'text' ? textInput : undefined,
      fontSize: toolType === 'text' ? fontSize : undefined,
      width: toolType === 'highlight' ? 140 : toolType === 'rectangle' ? 100 : 80,
      height: toolType === 'highlight' ? 22 : toolType === 'rectangle' ? 60 : 2,
      opacity: toolType === 'highlight' ? 0.35 : 1.0,
    };

    setAnnotations((prev) => [...prev, newAnn]);
  };

  const handleSave = async () => {
    if (!fileBytes || !file) return;
    if (annotations.length === 0) {
      setError('Please add at least one annotation.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const annotatedBytes = await applyVisualAnnotations(fileBytes, annotations);
      downloadFile(annotatedBytes, `${file.name.replace('.pdf', '')}_annotated.pdf`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply annotations.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to annotate"
          multiple={false}
          onFilesSelected={handleFilesSelected}
        />
      )}

      {file && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
              <p className="text-xs text-slate-500">
                {totalPages} pages • {annotations.length} annotations added
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setAnnotations([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Annotation Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
            {/* Tools */}
            <div className="flex items-center space-x-1 border-r border-slate-200 pr-3">
              <button
                type="button"
                onClick={() => { setToolType('text'); setColor('#0f172a'); }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold ${
                  toolType === 'text' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text Note</span>
              </button>

              <button
                type="button"
                onClick={() => { setToolType('highlight'); setColor('#fde047'); }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold ${
                  toolType === 'highlight' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>Highlight</span>
              </button>

              <button
                type="button"
                onClick={() => { setToolType('rectangle'); setColor('#ef4444'); }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold ${
                  toolType === 'rectangle' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1.5 border-r border-slate-200 pr-3">
              {['#0f172a', '#ef4444', '#0284c7', '#10b981', '#facc15'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border border-slate-300 ${color === c ? 'ring-2 ring-sky-500 scale-110' : ''}`}
                />
              ))}
            </div>

            {/* Text options if text selected */}
            {toolType === 'text' && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Note text"
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value={10}>10pt</option>
                  <option value={12}>12pt</option>
                  <option value={14}>14pt</option>
                  <option value={18}>18pt</option>
                  <option value={24}>24pt</option>
                </select>
              </div>
            )}

            <span className="text-slate-400 ml-auto">
              Click anywhere on document below to place
            </span>
          </div>

          {/* Interactive Document Page Canvas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold px-2">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              onClick={handleCanvasClick}
              className="relative border border-slate-300 rounded shadow bg-white max-w-full overflow-hidden cursor-crosshair"
            >
              <canvas ref={canvasRef} className="max-w-full h-auto block" />

              {/* Render overlay annotations */}
              {annotations
                .filter((a) => a.pageNumber === currentPage)
                .map((a) => (
                  <div
                    key={a.id}
                    style={{
                      position: 'absolute',
                      left: `${a.x}px`,
                      top: `${a.y}px`,
                      width: a.width ? `${a.width}px` : 'auto',
                      height: a.height ? `${a.height}px` : 'auto',
                      backgroundColor: a.type === 'highlight' ? a.color : 'transparent',
                      border: a.type === 'rectangle' ? `2px solid ${a.color}` : 'none',
                      color: a.color,
                      fontSize: a.fontSize ? `${a.fontSize}px` : '14px',
                      opacity: a.opacity ?? 1,
                    }}
                    className="pointer-events-none select-none font-bold"
                  >
                    {a.type === 'text' && a.text}
                  </div>
                ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Annotated PDF successfully saved and downloaded!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing || annotations.length === 0}
              onClick={handleSave}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Burning annotations locally...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Annotated PDF ({annotations.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
