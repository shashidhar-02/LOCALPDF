'use client';

import React, { useState } from 'react';
import { Lock, Info, ChevronDown, ChevronUp, Server, Shield } from 'lucide-react';

export default function PrivacyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <span>Your document stays in your browser.</span>
              <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                100% Client-Side
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              LocalPDF processes your document locally. Your PDF is not sent to our server for conversion.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 shrink-0 p-1 rounded hover:bg-emerald-100 transition"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Hide Details' : 'How It Works'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-emerald-200 text-xs text-emerald-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 p-3 rounded-lg border border-emerald-200/60">
            <div className="font-bold flex items-center space-x-1.5 text-slate-800 mb-1">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Website Hosting vs. Document Processing</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              When you visit LocalPDF, Vercel delivers the HTML, CSS, and WebAssembly scripts to your browser — exactly like loading a static webpage. Once loaded, all document reading, rendering, and manipulation occur exclusively in your device&apos;s local memory.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-lg border border-emerald-200/60">
            <div className="font-bold flex items-center space-x-1.5 text-slate-800 mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Network Transmission</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Open your browser&apos;s DevTools Network tab. You will see zero outbound requests containing your PDF or image bytes. We have no backend processing API, no analytics telemetry on document content, and no cloud storage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
