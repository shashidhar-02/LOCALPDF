import { Metadata } from 'next';
import { Cpu, Layers, HardDrive, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Architecture & Technical Design - LocalPDF',
  description:
    'Explore the client-side WebAssembly, PDF.js, and pdf-lib architecture powering LocalPDF.',
  alternates: {
    canonical: 'https://localpdf.app/architecture',
  },
};

export default function ArchitecturePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Technical Architecture
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          How LocalPDF runs complex PDF manipulation, rendering, and optical character recognition entirely inside the browser sandbox.
        </p>
      </div>

      {/* ASCII / Clean Architecture Diagram */}
      <section className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 font-mono text-xs border border-slate-800 shadow-md">
        <div className="text-sky-400 font-bold mb-4 text-sm">DATA FLOW ARCHITECTURE</div>
        <pre className="overflow-x-auto leading-relaxed text-slate-300">
{`+-----------------------------------------------------------+
|                        USER AGENT                         |
|                         (Browser)                         |
|                                                           |
|   +-----------------------+     +---------------------+   |
|   |      User File        | --> |   HTML5 File API    |   |
|   |  (e.g., contract.pdf) |     |  (Memory ArrayBuff) |   |
|   +-----------------------+     +---------------------+   |
|                                            |              |
|                    +-----------------------+              |
|                    |                                      |
|                    v                                      |
|   +---------------------------------------------------+   |
|   |            CLIENT PROCESSING ENGINES              |   |
|   |                                                   |   |
|   |  • pdf-lib: Stream rewrite, merge, split, rotate  |   |
|   |  • PDF.js: Sandboxed canvas render, text extract  |   |
|   |  • Tesseract.js: WebAssembly (WASM) local OCR     |   |
|   |  • docx: Client-side binary document packer       |   |
|   +---------------------------------------------------+   |
|                            |                              |
|                            v                              |
|   +---------------------------------------------------+   |
|   |                   LOCAL OUTPUT                    |   |
|   |                                                   |   |
|   |  • Blob / Object URL Generation                   |   |
|   |  • Direct Browser Download                        |   |
|   |  • Memory Cleanup & Object URL Revocation         |   |
|   +---------------------------------------------------+   |
|                                                           |
+-----------------------------------------------------------+
                      NO NETWORK TRANSMISSION
                       ZERO SERVER PROCESSING
`}
        </pre>
      </section>

      {/* Technology Stack Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">pdf-lib (Core Manipulation)</h2>
          <p className="text-slate-600 leading-relaxed">
            Written in pure TypeScript, pdf-lib parses PDF cross-reference tables, object dictionaries, and content streams directly in memory. We use it for zero-loss page extraction, document merging, orthogonal page rotation, AcroForm filling, and lossless stream compaction.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">PDF.js (Viewing & Text Extraction)</h2>
          <p className="text-slate-600 leading-relaxed">
            We configure Mozilla&apos;s PDF.js with <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">isEvalSupported: false</code> to eliminate arbitrary PDF JavaScript execution vulnerabilities. It handles thumbnail generation, high-DPI canvas rasterization, and internal text stream extraction.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Tesseract.js (Local WASM OCR)</h2>
          <p className="text-slate-600 leading-relaxed">
            Optical Character Recognition runs within an isolated Web Worker using compiled C++ WebAssembly binaries. Trained language data packs (English, Hindi, Telugu) are fetched once and stored in browser Cache Storage / IndexedDB for instant offline execution.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Memory & Security Management</h2>
          <p className="text-slate-600 leading-relaxed">
            Large documents can exhaust mobile browser memory if unmanaged. LocalPDF employs an active <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">ObjectUrlManager</code> that automatically revokes intermediate blob URLs, detaches canvas contexts, and garbage-collects ArrayBuffers upon operation completion.
          </p>
        </div>
      </section>
    </div>
  );
}
