'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, RotateCw } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { rotatePDF, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { parsePageRange } from '@/lib/page-ranges';
import { loadPdfDocument, renderPageThumbnail } from '@/lib/pdf-viewer-helper';

export default function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [scope, setScope] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1');
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      // Render thumbnail of page 1
      const doc = await loadPdfDocument(bytes);
      const thumb = await renderPageThumbnail(doc, 1, 240);
      setPreviewThumb(thumb);
    } catch (err: any) {
      setError('Could not read PDF. File may be corrupt or encrypted.');
    }
  };

  const handleRotate = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      let targetPages: number[] | undefined = undefined;
      if (scope === 'custom') {
        const { pages, errors } = parsePageRange(customRange, totalPages);
        if (errors.length > 0) {
          setError(errors.join(' '));
          setIsProcessing(false);
          return;
        }
        targetPages = pages;
      }

      const rotatedBytes = await rotatePDF(fileBytes, angle, targetPages);
      downloadFile(rotatedBytes, `${file.name.replace('.pdf', '')}_rotated_${angle}deg.pdf`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to rotate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select a PDF to rotate"
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
                setTotalPages(0);
                setPreviewThumb(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px]">
              <span className="text-xs font-semibold text-slate-500 mb-3">
                Live Preview (Page 1 with {angle}° Clockwise Rotation)
              </span>
              <div className="relative p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                {previewThumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewThumb}
                    alt="Page 1 preview"
                    style={{ transform: `rotate(${angle}deg)` }}
                    className="max-h-52 object-contain transition-transform duration-300"
                  />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAngle(90)}
                    className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition ${
                      angle === 90
                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    90° Clockwise
                  </button>
                  <button
                    type="button"
                    onClick={() => setAngle(180)}
                    className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition ${
                      angle === 180
                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    180° Flip
                  </button>
                  <button
                    type="button"
                    onClick={() => setAngle(270)}
                    className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition ${
                      angle === 270
                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    270° (90° Left)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Pages to Rotate
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      scope === 'all'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    All Pages ({totalPages})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('custom')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      scope === 'custom'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Selected Pages Only
                  </button>
                </div>

                {scope === 'custom' && (
                  <div>
                    <input
                      type="text"
                      value={customRange}
                      onChange={(e) => setCustomRange(e.target.value)}
                      placeholder="e.g. 1, 3, 5-8"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter page numbers or ranges to rotate.
                    </p>
                  </div>
                )}
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
              <span>Rotated PDF successfully saved and downloaded!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRotate}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rotating locally...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate PDF by {angle}°</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
