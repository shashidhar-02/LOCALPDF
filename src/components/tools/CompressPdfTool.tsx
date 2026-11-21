'use client';

import React, { useState } from 'react';
import { Download, Loader2, AlertTriangle, CheckCircle2, Minimize2, ArrowRight } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { compressPdfDocument } from '@/lib/compression-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { CompressionResult } from '@/lib/types';

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [mode, setMode] = useState<'lossless' | 'raster'>('lossless');
  const [quality, setQuality] = useState<number>(0.75); // for raster mode
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setResult(null);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setFile(selected);
      setFileBytes(bytes);
    } catch (err) {
      setError('Could not open PDF file.');
    }
  };

  const handleCompress = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await compressPdfDocument(
        fileBytes,
        {
          mode,
          imageQuality: quality,
          scale: mode === 'raster' ? 1.2 : 1.0,
        },
        (current, total, msg) => {
          setProgressMessage(msg);
        }
      );

      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Compression failed.');
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadFile(result.pdfData, `${file.name.replace('.pdf', '')}_compressed.pdf`);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to compress"
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
                Original size: <strong className="text-slate-800">{formatBytes(file.size)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setResult(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('lossless')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'lossless'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1 flex items-center justify-between">
                <span>Lossless Structure Optimization</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Removes unreferenced objects, compacts stream tables, and preserves 100% of selectable text and vector fonts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('raster')}
              className={`p-4 rounded-xl border text-left transition ${
                mode === 'raster'
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 mb-1">
                Rasterized Compression
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Renders and re-encodes pages as compressed images. Ideal for large scanned documents and photo-heavy PDFs.
              </p>
            </button>
          </div>

          {/* Warning for raster mode */}
          {mode === 'raster' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start space-x-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Rasterized compression converts pages into images. Selectable text and vector line clarity may be reduced.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Image Quality Target</span>
                  <span>{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Smallest Size (30%)</span>
                  <span>Balanced (65%)</span>
                  <span>Highest Quality (90%)</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Before</span>
                    <span className="text-sm font-bold text-slate-800">{formatBytes(result.originalBytes)}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400" />

                  <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">After</span>
                    <span className="text-sm font-bold text-emerald-600">{formatBytes(result.newBytes)}</span>
                  </div>

                  <div className="pl-2">
                    <span className="block text-2xl font-extrabold text-emerald-600">
                      {result.savingsPercent > 0 ? `-${result.savingsPercent}%` : '0%'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {result.savingsPercent > 0 ? 'Space saved' : 'No reduction possible'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed PDF</span>
                </button>
              </div>

              {result.warning && (
                <div className="text-xs text-slate-600 p-2.5 bg-white rounded-lg border border-slate-200">
                  {result.warning}
                </div>
              )}
            </div>
          )}

          {!result && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompress}
                className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressMessage || 'Compressing locally...'}</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>Compress PDF</span>
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
