'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, RotateCw, Trash2, ArrowLeft, ArrowRight, Grid } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { reorderAndModifyPages, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { loadPdfDocument, renderPageThumbnail } from '@/lib/pdf-viewer-helper';

interface PageCardItem {
  id: string;
  originalIndex: number; // 0-based
  displayPageNum: number;
  rotation: number;
  thumbnail: string;
}

export default function PageOrganizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<PageCardItem[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
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
      const totalPages = await getPDFPageCount(bytes);

      setFile(selected);
      setFileBytes(bytes);
      setIsLoadingThumbs(true);

      const doc = await loadPdfDocument(bytes);
      const items: PageCardItem[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const thumb = await renderPageThumbnail(doc, i, 160);
        items.push({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i - 1,
          displayPageNum: i,
          rotation: 0,
          thumbnail: thumb,
        });
      }

      setPages(items);
    } catch (err: any) {
      setError('Could not open PDF file. It may be corrupt or encrypted.');
    } finally {
      setIsLoadingThumbs(false);
    }
  };

  const handleMove = (idx: number, dir: 'left' | 'right') => {
    const targetIdx = dir === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRotate = (idx: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        rotation: (copy[idx].rotation + 90) % 360,
      };
      return copy;
    });
  };

  const handleDelete = (idx: number) => {
    if (pages.length <= 1) {
      setError('A PDF document must retain at least one page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!fileBytes || !file || pages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const organizedBytes = await reorderAndModifyPages(
        fileBytes,
        pages.map((p) => ({
          originalIndex: p.originalIndex,
          rotation: p.rotation,
        }))
      );

      downloadFile(organizedBytes, `${file.name.replace('.pdf', '')}_organized.pdf`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save organized PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to organize & reorder"
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
                {pages.length} pages currently • {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setPages([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {isLoadingThumbs && (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-600" />
              <p>Generating page thumbnails in local memory...</p>
            </div>
          )}

          {!isLoadingThumbs && pages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Page Grid ({pages.length} Pages)
                </span>
                <span className="text-xs text-slate-500">
                  Use arrows to reorder, rotate button to adjust orientation, or trash icon to delete.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm flex flex-col group hover:border-sky-300 transition"
                  >
                    <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.thumbnail}
                        alt={`Page ${p.displayPageNum}`}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2">
                      <span>Orig. Page {p.originalIndex + 1}</span>
                      {p.rotation > 0 && (
                        <span className="text-[10px] text-sky-600 font-bold">
                          +{p.rotation}°
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'left')}
                          className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 rounded"
                          title="Move Earlier"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={() => handleMove(idx, 'right')}
                          className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 rounded"
                          title="Move Later"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotate(idx)}
                          className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Organized PDF successfully saved and downloaded!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing || pages.length === 0}
              onClick={handleSave}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving organized document...</span>
                </>
              ) : (
                <>
                  <Grid className="w-4 h-4" />
                  <span>Save Organized PDF ({pages.length} Pages)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
