'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, PenTool, Type, Image as ImageIcon, RotateCw, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { applyVisualSignatures, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { VisualSignature } from '@/lib/types';
import { loadPdfDocument, renderPdfPageToCanvas } from '@/lib/pdf-viewer-helper';

export default function SignPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Signature creator state
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('John Doe');
  const [typedFont, setTypedFont] = useState('cursive');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Placement state
  const [placedSignatures, setPlacedSignatures] = useState<VisualSignature[]>([]);
  const [sigX, setSigX] = useState<number>(100);
  const [sigY, setSigY] = useState<number>(150);
  const [sigWidth, setSigWidth] = useState<number>(180);
  const [sigHeight, setSigHeight] = useState<number>(70);
  const [sigRotation, setSigRotation] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load PDF when file is selected
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
      setCurrentPage(1);

      try {
        const loadedDoc = await loadPdfDocument(bytes);
        setPdfDoc(loadedDoc);
      } catch (previewErr) {
        console.warn('PDF.js preview could not be loaded:', previewErr);
      }
    } catch (err: any) {
      setError('Could not read PDF. File may be corrupt or encrypted.');
    }
  };

  // Render current page onto pageCanvas
  useEffect(() => {
    if (pdfDoc && pageCanvasRef.current) {
      renderPdfPageToCanvas(pdfDoc, currentPage, pageCanvasRef.current, 1.0).catch(console.error);
    }
  }, [pdfDoc, currentPage]);

  // Drawing Pad Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = drawCanvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  // Type signature handler
  const generateTypedSignature = (text: string, font: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = `italic 48px ${font}`;
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, 200, 75);
    const url = canvas.toDataURL('image/png');
    setSignatureDataUrl(url);
  };

  // Image upload handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignatureDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Place signature on current page
  const handlePlaceOnPage = () => {
    if (!signatureDataUrl) {
      setError('Please create or upload a signature first.');
      return;
    }

    const newSig: VisualSignature = {
      id: `sig-${Date.now()}`,
      type: activeTab === 'upload' ? 'image' : activeTab,
      dataUrl: signatureDataUrl,
      x: sigX,
      y: sigY,
      width: sigWidth,
      height: sigHeight,
      rotation: sigRotation,
      pageNumber: currentPage,
    };

    setPlacedSignatures((prev) => [...prev, newSig]);
    setError(null);
  };

  const handleApplyAndDownload = async () => {
    if (!fileBytes || !file) return;
    if (placedSignatures.length === 0) {
      setError('Please place at least one signature on a page.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const signedBytes = await applyVisualSignatures(fileBytes, placedSignatures);
      downloadFile(signedBytes, `${file.name.replace('.pdf', '')}_signed.pdf`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to sign"
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
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setPlacedSignatures([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Signature Creation Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('draw')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition mr-2 ${
                    activeTab === 'draw'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('type');
                    generateTypedSignature(typedName, typedFont);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition mr-2 ${
                    activeTab === 'type'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Type</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === 'upload'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>

              {/* Tab 1: Draw */}
              {activeTab === 'draw' && (
                <div className="space-y-2">
                  <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner">
                    <canvas
                      ref={drawCanvasRef}
                      width={380}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="signature-canvas w-full h-[150px] cursor-crosshair"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sign with finger or mouse</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Type */}
              {activeTab === 'type' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => {
                      setTypedName(e.target.value);
                      generateTypedSignature(e.target.value, typedFont);
                    }}
                    placeholder="Enter your name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {['cursive', 'Brush Script MT', 'Dancing Script, cursive'].map((font, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTypedFont(font);
                          generateTypedSignature(typedName, font);
                        }}
                        style={{ fontFamily: font }}
                        className={`p-2 border rounded-lg text-sm truncate bg-white ${
                          typedFont === font ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
                        }`}
                      >
                        {typedName || 'Signature'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Upload */}
              {activeTab === 'upload' && (
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-white">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleSignatureUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Transparent PNG recommended for best results.
                  </p>
                </div>
              )}

              {/* Placement Adjustments */}
              <div className="pt-3 border-t border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block">
                  Signature Size & Coordinates
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5">X Position: {sigX}px</label>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      value={sigX}
                      onChange={(e) => setSigX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Y Position: {sigY}px</label>
                    <input
                      type="range"
                      min="10"
                      max="600"
                      value={sigY}
                      onChange={(e) => setSigY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Width: {sigWidth}px</label>
                    <input
                      type="range"
                      min="80"
                      max="300"
                      value={sigWidth}
                      onChange={(e) => {
                        const w = parseInt(e.target.value);
                        setSigWidth(w);
                        setSigHeight(Math.round(w * 0.4));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Rotation: {sigRotation}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={sigRotation}
                      onChange={(e) => setSigRotation(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOnPage}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg transition"
                >
                  Place Signature on Page {currentPage}
                </button>
              </div>

              {/* Placed Signatures list */}
              {placedSignatures.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Stamps to Apply ({placedSignatures.length})</span>
                    <button
                      type="button"
                      onClick={() => setPlacedSignatures([])}
                      className="text-red-500 text-[10px]"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {placedSignatures.map((s, idx) => (
                      <div key={s.id} className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 flex justify-between items-center">
                        <span>Stamp #{idx + 1} on Page {s.pageNumber}</span>
                        <button
                          type="button"
                          onClick={() => setPlacedSignatures((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Page Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xs font-bold text-slate-700">
                  Document Preview (Page {currentPage} of {totalPages})
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

              <div className="relative border border-slate-300 rounded shadow bg-white max-w-full overflow-hidden">
                <canvas ref={pageCanvasRef} className="max-w-full h-auto block" />

                {/* Overlay live placed signatures on this page */}
                {placedSignatures
                  .filter((s) => s.pageNumber === currentPage)
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        position: 'absolute',
                        left: `${s.x}px`,
                        top: `${s.y}px`,
                        width: `${s.width}px`,
                        height: `${s.height}px`,
                        transform: `rotate(${s.rotation}deg)`,
                      }}
                      className="border border-sky-500 border-dashed pointer-events-none"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.dataUrl} alt="Signature stamp" className="w-full h-full object-contain" />
                    </div>
                  ))}
              </div>

              <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start space-x-1.5 text-left w-full">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Notice: Applies a visual signature stamp onto the document. This is not a cryptographic PKI certificate.
                </span>
              </div>
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
              <span>Signed PDF generated and downloaded!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing || placedSignatures.length === 0}
              onClick={handleApplyAndDownload}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Burning signature onto PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
