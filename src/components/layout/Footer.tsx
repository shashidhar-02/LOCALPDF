import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Github, Lock, CheckCircle2 } from 'lucide-react';
import { TOOLS } from '@/lib/tools-data';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-24">
      {/* Privacy Callout in Footer */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                100% Client-Side Privacy Guarantee
              </h4>
              <p className="text-xs text-slate-400">
                Your PDF is processed inside your browser&apos;s sandbox. No file bytes are ever uploaded to any server.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
            <span className="flex items-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> No Upload
            </span>
            <span className="flex items-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> No Account
            </span>
            <span className="flex items-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> No Watermark
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 text-white font-bold text-lg mb-3">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <span>LocalPDF</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
              A browser-only PDF utility suite designed for people who need quick, private PDF operations without subscriptions, software installation, or document uploads.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Vercel serves the static web assets.</div>
              <div className="text-sky-400 font-medium">Your browser performs 100% of the work.</div>
            </div>
          </div>

          {/* Tools 1 */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Organize
            </h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/merge-pdf" className="hover:text-white transition">Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="hover:text-white transition">Split PDF</Link></li>
              <li><Link href="/extract-pdf-pages" className="hover:text-white transition">Extract Pages</Link></li>
              <li><Link href="/rotate-pdf" className="hover:text-white transition">Rotate PDF</Link></li>
              <li><Link href="/pdf-page-organizer" className="hover:text-white transition">Page Organizer</Link></li>
            </ul>
          </div>

          {/* Tools 2 */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Convert & Optimize
            </h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/jpg-to-pdf" className="hover:text-white transition">JPG to PDF</Link></li>
              <li><Link href="/compress-pdf" className="hover:text-white transition">Compress PDF</Link></li>
              <li><Link href="/pdf-to-text" className="hover:text-white transition">PDF to Text / DOCX</Link></li>
              <li><Link href="/pdf-ocr" className="hover:text-white transition">Local OCR</Link></li>
            </ul>
          </div>

          {/* Edit & Security */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Edit & Trust
            </h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/sign-pdf" className="hover:text-white transition">Sign PDF</Link></li>
              <li><Link href="/annotate-pdf" className="hover:text-white transition">Annotate PDF</Link></li>
              <li><Link href="/fill-pdf" className="hover:text-white transition">Fill PDF Forms</Link></li>
              <li><Link href="/pdf-metadata" className="hover:text-white transition">PDF Metadata</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/architecture" className="hover:text-white transition">Architecture</Link></li>
              <li><Link href="/benchmarks" className="hover:text-white transition">Benchmarks</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} LocalPDF. Open source under the MIT License.
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <a
              href="https://github.com/shashidharmushike/localpdf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:text-white transition"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
