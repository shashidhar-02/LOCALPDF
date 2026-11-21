'use client';

import React, { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, Layers, Check } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { extractPages, getPDFPageCount } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { parsePageRange, formatPageRange } from '@/lib/page-ranges';
import { loadPdfDocument, renderPageThumbnail } from '@/lib/pdf-viewer-helper';

export default function ExtractPagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
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
      setSelectedPages([1]);
      setRangeInput('1');

      // Load thumbnails lazily
      setLoadingThumbnails(true);
      loadThumbnails(bytes, pages);
    } catch (err: any) {
      setError('Could not read PDF. File may be corrupt or encrypted.');
    }
  };

  const loadThumbnails = async (bytes: Uint8Array, pages: number) => {
    try {
      const doc = await loadPdfDocument(bytes);
      const maxToRender = Math.min(pages, 48); // Render up to 48 thumbs for memory safety
      for (let i = 1; i <= maxToRender; i++) {
        try {
          const thumb = await renderPageThumbnail(doc, i, 160);
          setThumbnails((prev) => [...prev, thumb]);
        } catch {
          setThumbnails((prev) => [...prev, '']);
        }
      }
    } catch (err) {
      console.warn('Could not render thumbnails:', err);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      let next: number[];
      if (prev.includes(pageNum)) {
        next = prev.filter((p) => p !== pageNum);
      } else {
        next = [...prev, pageNum].sort((a, b) => a - b);
      }
      setRangeInput(formatPageRange(next));
      return next;
    });
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const { pages, errors } = parsePageRange(val, totalPages);
    if (errors.length === 0 && pages.length > 0) {
      setSelectedPages(pages);
      setError(null);
    }
  };

  const handleSelectAll = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(formatPageRange(all));
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleExtract = async () => {
    if (!fileBytes || !file) return;

    if (selectedPages.length === 0) {
      setError('Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const extractedBytes = await extractPages(fileBytes, selectedPages);
      downloadFile(
        extractedBytes,
        `${file.name.replace('.pdf', '')}_extracted_pages_${formatPageRange(selectedPages).replace(/\s+/g, '')}.pdf`
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select a PDF to extract pages from"
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
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} total • {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setTotalPages(0);
                setThumbnails([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Range Selection Input & Quick Buttons */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                Selected Pages to Extract (e.g. 1, 3, 5-8, 10-12)
              </label>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <input
              type="text"
              value={rangeInput}
              onChange={handleRangeInputChange}
              placeholder="e.g. 1, 3, 5-8, 10-12"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 font-mono"
            />
            <p className="text-xs text-slate-500">
              Click thumbnails below or type page ranges. {selectedPages.length} of {totalPages} pages selected.
            </p>
          </div>

          {/* Visual Thumbnail Grid */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Click page thumbnails to select / deselect
            </h5>

            {loadingThumbnails && (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl text-xs text-slate-500 space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Rendering page thumbnails locally...</span>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = selectedPages.includes(pageNum);
                const thumb = thumbnails[pageNum - 1];

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => togglePage(pageNum)}
                    className={`relative rounded-xl border p-2 flex flex-col items-center justify-center transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-[3/4] w-full bg-white rounded border border-slate-100 overflow-hidden flex items-center justify-center relative mb-1.5 shadow-sm">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400">Page {pageNum}</span>
                      )}

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-sky-600 text-white rounded-full flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      Page {pageNum}
                    </span>
                  </button>
                );
              })}
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
              <span>Extracted PDF successfully downloaded!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Selected: <strong className="text-slate-800">{selectedPages.length} pages</strong>
            </span>

            <button
              type="button"
              disabled={isProcessing || selectedPages.length === 0}
              onClick={handleExtract}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting pages...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Extract {selectedPages.length} Pages</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
