'use client';

import React, { useState } from 'react';
import { Download, Loader2, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { extractPdfText } from '@/lib/pdf-viewer-helper';
import { createDocxFromText } from '@/lib/docx-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';

export default function PdfToTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageTexts, setPageTexts] = useState<{ page: number; text: string }[]>([]);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setExtractedText('');
    setPageTexts([]);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setFile(selected);
      setFileBytes(bytes);

      setIsExtracting(true);
      const { fullText, pageTexts } = await extractPdfText(bytes, (cur, total) => {
        setProgressMsg(`Extracting text from page ${cur} of ${total}...`);
      });

      setExtractedText(fullText);
      setPageTexts(pageTexts);

      if (!fullText.trim()) {
        setError('No selectable text detected. This document appears to be a scanned image. Use our Local PDF OCR tool to recognize text from scanned images.');
      }
    } catch (err: any) {
      setError('Could not extract text from PDF. It may be corrupt or encrypted.');
    } finally {
      setIsExtracting(false);
      setProgressMsg('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${file.name.replace('.pdf', '')}_text.txt`, 'text/plain');
  };

  const handleDownloadDocx = async () => {
    if (!pageTexts || !file) return;
    setIsGeneratingDocx(true);
    try {
      const docxBytes = await createDocxFromText(file.name.replace('.pdf', ''), pageTexts);
      downloadFile(
        docxBytes,
        `${file.name.replace('.pdf', '')}_exported.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    } catch (err: any) {
      setError('Failed to generate DOCX file.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to extract text & export DOCX"
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
                {formatBytes(file.size)} • {pageTexts.length} pages parsed
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setExtractedText('');
                setPageTexts([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Honest Layout-Preserving Disclaimer */}
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start space-x-2.5 text-xs text-sky-900">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Best-effort text export</strong>
              <span>
                LocalPDF extracts the internal text stream directly from your document without uploading it to cloud conversion servers. Text and paragraphs are preserved; complex multi-column publishing graphics are simplified into linear document flows.
              </span>
            </div>
          </div>

          {isExtracting && (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-600" />
              <p>{progressMsg || 'Extracting text layer locally...'}</p>
            </div>
          )}

          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extracted Document Text
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
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                </div>
              </div>

              <textarea
                value={extractedText}
                readOnly
                rows={12}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none"
              />

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isGeneratingDocx}
                  onClick={handleDownloadDocx}
                  className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isGeneratingDocx ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating DOCX in browser...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Export Editable Word (.docx)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
