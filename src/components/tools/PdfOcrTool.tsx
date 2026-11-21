'use client';

import React, { useState } from 'react';
import { Download, Loader2, Copy, Check, ScanText, Globe } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { runLocalOcr, OCR_LANGUAGES, SupportedOcrLanguage, OcrProgress } from '@/lib/ocr-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { loadPdfDocument, renderPageThumbnail } from '@/lib/pdf-viewer-helper';

export default function PdfOcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<SupportedOcrLanguage>('eng');
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
    setResultText('');
    setProgress(null);
  };

  const handleRunOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResultText('');

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const images: string[] = [];

      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);

      if (isImage) {
        // Direct image
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file.'));
          reader.readAsDataURL(file);
        });
        images.push(dataUrl);
      } else {
        // PDF: render pages to high-res images for OCR
        const doc = await loadPdfDocument(bytes);
        const total = Math.min(doc.numPages, 10); // Process up to 10 pages locally for memory safety
        for (let i = 1; i <= total; i++) {
          try {
            const thumb = await renderPageThumbnail(doc, i, 800); // 800px width for good OCR resolution
            if (thumb) images.push(thumb);
          } catch (renderErr) {
            console.warn(`Could not render page ${i} for OCR:`, renderErr);
          }
        }
      }

      const { fullText } = await runLocalOcr(images, lang, (p) => {
        setProgress(p);
      });

      setResultText(fullText);
    } catch (err: any) {
      setError(err?.message || 'Local OCR failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!resultText || !file) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${file.name.replace(/\.[^/.]+$/, '')}_ocr.txt`, 'text/plain');
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf,image/jpeg,image/png"
          acceptLabel="Select scanned PDF or Photo for Local OCR"
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
                {formatBytes(file.size)} • {file.type.includes('image') ? 'Image File' : 'Scanned PDF'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultText('');
                setProgress(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Language Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-3">
              <Globe className="w-4 h-4 text-sky-600" />
              <span>Select OCR Recognition Language</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OCR_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`p-3 rounded-xl border text-left transition ${
                    lang === l.code
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">{l.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Code: {l.code}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 mt-3">
              Language data packs are cached in your browser storage via IndexedDB once downloaded.
            </p>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>{progress?.status || 'Processing locally...'}</span>
                </span>
                <span>{Math.round((progress?.progress || 0) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${Math.round((progress?.progress || 0) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {resultText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recognized OCR Text
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                </div>
              </div>

              <textarea
                value={resultText}
                readOnly
                rows={12}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {!resultText && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRunOcr}
                className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running local OCR...</span>
                  </>
                ) : (
                  <>
                    <ScanText className="w-4 h-4" />
                    <span>Start Local OCR</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
