'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, ShieldAlert, FileText, Trash2 } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { readPDFMetadata, updatePDFMetadata, stripPDFMetadata } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { PDFMetadata } from '@/lib/types';

export default function PdfMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [meta, setMeta] = useState<PDFMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    producer: '',
    creator: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setSuccessMessage(null);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const metadata = await readPDFMetadata(bytes);

      setFile(selected);
      setFileBytes(bytes);
      setMeta(metadata);
    } catch (err: any) {
      setError('Could not inspect PDF metadata. File may be encrypted or corrupted.');
    }
  };

  const handleUpdate = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedBytes = await updatePDFMetadata(fileBytes, meta);
      downloadFile(updatedBytes, `${file.name.replace('.pdf', '')}_updated_meta.pdf`);
      setSuccessMessage('Metadata updated and new PDF downloaded!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStrip = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const cleanBytes = await stripPDFMetadata(fileBytes);
      downloadFile(cleanBytes, `${file.name.replace('.pdf', '')}_anonymized.pdf`);
      setSuccessMessage('All identifying metadata stripped and anonymized PDF downloaded!');
      setMeta({
        title: '',
        author: '',
        subject: '',
        keywords: '',
        producer: '',
        creator: '',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to strip metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to view & edit metadata"
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
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Document Identification Tags
              </h5>
              <button
                type="button"
                onClick={handleStrip}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Strip All Metadata (Anonymize)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  placeholder="e.g. Annual Report 2026"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Author / Creator Name</label>
                <input
                  type="text"
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={meta.subject}
                  onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                  placeholder="e.g. Financial Overview"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={meta.keywords}
                  onChange={(e) => setMeta({ ...meta, keywords: e.target.value })}
                  placeholder="e.g. finance, quarterly, report"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Creator Software</label>
                <input
                  type="text"
                  value={meta.creator}
                  onChange={(e) => setMeta({ ...meta, creator: e.target.value })}
                  placeholder="e.g. Microsoft Word / Canva"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Producer Engine</label>
                <input
                  type="text"
                  value={meta.producer}
                  onChange={(e) => setMeta({ ...meta, producer: e.target.value })}
                  placeholder="e.g. PDF Engine"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {(meta.creationDate || meta.modificationDate) && (
              <div className="pt-2 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-100">
                {meta.creationDate && <div>Created: {new Date(meta.creationDate).toLocaleString()}</div>}
                {meta.modificationDate && <div>Modified: {new Date(meta.modificationDate).toLocaleString()}</div>}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleUpdate}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving metadata...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF with Updated Metadata</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
