'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, CheckSquare, Edit3 } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { getAcroFields, fillAcroFields, applyVisualAnnotations } from '@/lib/pdf-engine';
import { downloadFile } from '@/lib/object-url';
import { formatBytes } from '@/lib/format';
import { AcroFormFieldInfo } from '@/lib/types';

export default function FillPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fields, setFields] = useState<AcroFormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [hasAcroForms, setHasAcroForms] = useState<boolean>(false);
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
      const detected = await getAcroFields(bytes);

      setFile(selected);
      setFileBytes(bytes);
      setFields(detected);
      setHasAcroForms(detected.length > 0);

      const initialVals: Record<string, string | boolean> = {};
      detected.forEach((f) => {
        initialVals[f.name] = f.value;
      });
      setFieldValues(initialVals);
    } catch (err: any) {
      setError('Could not read form fields from PDF.');
    }
  };

  const handleSave = async () => {
    if (!fileBytes || !file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const filledBytes = await fillAcroFields(fileBytes, fieldValues);
      downloadFile(filledBytes, `${file.name.replace('.pdf', '')}_filled.pdf`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save filled PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF Form to Fill"
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
                {hasAcroForms ? `${fields.length} interactive form fields detected` : 'Flat document (no interactive form fields)'} • {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileBytes(null);
                setFields([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {hasAcroForms ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Interactive Form Fields
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.name} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title={f.name}>
                      {f.name}
                    </label>

                    {f.type === 'checkbox' ? (
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(fieldValues[f.name])}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [f.name]: e.target.checked })
                          }
                          className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300"
                        />
                        <span className="text-xs text-slate-600">Checked</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={String(fieldValues[f.name] || '')}
                        onChange={(e) =>
                          setFieldValues({ ...fieldValues, [f.name]: e.target.value })
                        }
                        placeholder="Type answer..."
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No interactive AcroForm fields found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This document is a scanned or flattened PDF. To type notes, check boxes, or signatures onto flat forms, use our <strong>Annotate PDF</strong> or <strong>Sign PDF</strong> tools.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <a
                  href="/annotate-pdf"
                  className="px-4 py-2 bg-sky-600 text-white font-semibold text-xs rounded-lg hover:bg-sky-700 transition"
                >
                  Open Annotate Tool
                </a>
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
              <span>Filled PDF form downloaded successfully!</span>
            </div>
          )}

          {hasAcroForms && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSave}
                className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving form in browser...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Completed Form</span>
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
