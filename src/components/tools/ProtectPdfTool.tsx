'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert, CheckCircle2, Lock, ArrowRight, ExternalLink } from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { formatBytes } from '@/lib/format';

export default function ProtectPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Check for /Encrypt dictionary in PDF bytes
      const headerStr = new TextDecoder().decode(bytes.slice(0, 10000));
      const footerStr = new TextDecoder().decode(bytes.slice(Math.max(0, bytes.length - 10000)));
      const hasEncrypt = headerStr.includes('/Encrypt') || footerStr.includes('/Encrypt');
      setIsEncrypted(hasEncrypt);
    } catch {
      setIsEncrypted(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          acceptedMimeTypes="application/pdf"
          acceptLabel="Select PDF to inspect security status"
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
                setIsEncrypted(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Security Status Box */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isEncrypted ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                {isEncrypted ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {isEncrypted ? 'Document Has Encryption Flags Detected' : 'Unencrypted Standard PDF Document'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isEncrypted
                    ? 'This file contains standard PDF security dictionaries.'
                    : 'This file does not have password restrictions applied.'}
                </p>
              </div>
            </div>
          </div>

          {/* Transparent Cryptography Assessment */}
          <div className="bg-slate-900 text-slate-300 rounded-xl p-6 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Our Stance on Client-Side PDF Password Encryption</span>
            </div>

            <p className="leading-relaxed">
              Standard Adobe PDF encryption requires certified AES-256 standard security handlers, revision 5/6 key derivation algorithms, and cross-reference stream encryption. Many online converters that claim to encrypt PDFs in the browser either secretly upload your document to a cloud server or apply pseudo-passwords that any free PDF tool can bypass in one second.
            </p>

            <p className="leading-relaxed">
              In accordance with Section 3.L of our engineering standards, <strong>LocalPDF does not implement fake password protection</strong>. True WebAssembly-based AES-256 standard encryption is currently undergoing formal cryptographic review on our open-source roadmap.
            </p>

            <div className="pt-3 border-t border-slate-800">
              <span className="font-bold text-white block mb-1">Recommended Local Tools for High-Security AES Encryption:</span>
              <ul className="space-y-1 text-slate-400">
                <li>• <strong>qpdf CLI:</strong> Open-source, zero cloud upload: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400">qpdf --encrypt user_pw owner_pw 256 -- in.pdf out.pdf</code></li>
                <li>• <strong>LocalPDF Metadata Stripper:</strong> Strip identifying computer usernames, dates, and device tags instantly with our <a href="/pdf-metadata" className="text-sky-400 underline">Metadata Tool</a>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
