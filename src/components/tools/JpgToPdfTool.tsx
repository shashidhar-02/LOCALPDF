'use client';

import React, { useState } from 'react';
import { Download, ArrowUp, ArrowDown, RotateCw, Trash2, Settings, Loader2 } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { imagesToPDF } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { ImageToPdfOptions, PageSizeOption, PageOrientation, MarginOption } from '@/lib/types';
import { formatBytes } from '@/lib/format';

interface ImageItem {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
}

export default function JpgToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'none',
    fitMode: 'contain',
    quality: 0.9,
    title: 'Combined Images',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setError(null);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImages((prev) => [
            ...prev,
            {
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              file,
              dataUrl,
              width: img.width,
              height: img.height,
              rotation: 0,
            },
          ]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRotate = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        rotation: (copy[idx].rotation + 90) % 360,
      };
      return copy;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await imagesToPDF(
        images.map((img) => ({
          dataUrl: img.dataUrl,
          width: img.width,
          height: img.height,
          rotation: img.rotation,
        })),
        options
      );

      downloadFile(pdfBytes, `${options.title || 'images'}.pdf`);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        acceptedMimeTypes="image/jpeg,image/png,image/webp"
        acceptLabel="Drop photos (JPG, PNG, WebP) here"
        multiple={true}
        onFilesSelected={handleFilesSelected}
      />

      {images.length > 0 && (
        <div className="space-y-6">
          {/* Options Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              <Settings className="w-4 h-4 text-sky-600" />
              <span>PDF Layout Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Page Size */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Page Size</label>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions({ ...options, pageSize: e.target.value as PageSizeOption })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="a4">A4 (Standard)</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit to Image Size</option>
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Orientation</label>
                <select
                  value={options.orientation}
                  onChange={(e) => setOptions({ ...options, orientation: e.target.value as PageOrientation })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="auto">Auto (Match Photo)</option>
                </select>
              </div>

              {/* Margins */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Margins</label>
                <select
                  value={options.margin}
                  onChange={(e) => setOptions({ ...options, margin: e.target.value as MarginOption })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="none">No Margin (Full Bleed)</option>
                  <option value="small">Small (0.25 in)</option>
                  <option value="medium">Medium (0.5 in)</option>
                  <option value="large">Large (0.75 in)</option>
                </select>
              </div>

              {/* Image Fit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fit Mode</label>
                <select
                  value={options.fitMode}
                  onChange={(e) => setOptions({ ...options, fitMode: e.target.value as 'contain' | 'cover' })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="contain">Fit / Contain (No crop)</option>
                  <option value="cover">Fill / Cover (Crop edges)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={options.title || ''}
                  onChange={(e) => setOptions({ ...options, title: e.target.value })}
                  placeholder="My Combined Photos"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Reorderable Image Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Image Sequence ({images.length} {images.length === 1 ? 'image' : 'images'})
              </h4>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm relative group flex flex-col"
                >
                  <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.dataUrl}
                      alt={img.file.name}
                      style={{ transform: `rotate(${img.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-800 truncate mb-1">
                    {img.file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mb-2">
                    {formatBytes(img.file.size)} • {img.width}x{img.height}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 rounded"
                        title="Move Earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 rounded"
                        title="Move Later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
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
                      onClick={() => handleRemove(idx)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing || images.length === 0}
              onClick={handleConvert}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting in browser...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Convert {images.length} Images to PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
