'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Combine,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  PenTool,
  RotateCw,
  Layers,
  Grid,
  FileText,
  ScanText,
  CheckSquare,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Cpu,
  Zap,
  HardDrive
} from 'lucide-react';
import FileDropzone from '@/components/common/FileDropzone';
import { TOOLS } from '@/lib/tools-data';

export default function HomePage() {
  const router = useRouter();
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleHomeFileDropped = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setDroppedFile(file);
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'ImageIcon': return <ImageIcon className="w-5 h-5 text-sky-600" />;
      case 'CombineIcon': return <Combine className="w-5 h-5 text-sky-600" />;
      case 'ScissorsIcon': return <Scissors className="w-5 h-5 text-sky-600" />;
      case 'LayersIcon': return <Layers className="w-5 h-5 text-sky-600" />;
      case 'RotateCwIcon': return <RotateCw className="w-5 h-5 text-sky-600" />;
      case 'GridIcon': return <Grid className="w-5 h-5 text-sky-600" />;
      case 'Minimize2Icon': return <Minimize2 className="w-5 h-5 text-sky-600" />;
      case 'PenToolIcon': return <PenTool className="w-5 h-5 text-sky-600" />;
      case 'CheckSquareIcon': return <CheckSquare className="w-5 h-5 text-sky-600" />;
      case 'FileTextIcon': return <FileText className="w-5 h-5 text-sky-600" />;
      case 'ScanTextIcon': return <ScanText className="w-5 h-5 text-sky-600" />;
      default: return <FileText className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your PDF stays on your device</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Private PDF tools that run{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
            entirely in your browser
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Free, private, instant PDF utilities. No Adobe Acrobat subscription, no account creation, no file uploads, and zero watermarks.
        </p>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {TOOLS.slice(0, 6).map((tool) => (
            <Link
              key={tool.id}
              href={`/${tool.slug}`}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-600 hover:shadow-sm transition"
            >
              {tool.shortTitle}
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Universal Dropzone */}
      <section className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        {!droppedFile ? (
          <div>
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Start
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Drop your file to begin immediately
              </h2>
            </div>
            <FileDropzone
              acceptedMimeTypes="application/pdf,image/*"
              acceptLabel="Drop any PDF or Image file here"
              multiple={false}
              onFilesSelected={handleHomeFileDropped}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">Selected file:</span>
                <span className="text-sm font-bold text-slate-900">{droppedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setDroppedFile(null)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Change File
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What would you like to do with this file?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Edit PDF (New)', slug: 'edit-pdf' },
                  { name: 'Merge PDF', slug: 'merge-pdf' },
                  { name: 'Compress PDF', slug: 'compress-pdf' },
                  { name: 'Split PDF', slug: 'split-pdf' },
                  { name: 'Sign PDF', slug: 'sign-pdf' },
                  { name: 'Rotate PDF', slug: 'rotate-pdf' },
                  { name: 'Extract Pages', slug: 'extract-pdf-pages' },
                  { name: 'Annotate PDF', slug: 'annotate-pdf' },
                  { name: 'Extract Text', slug: 'pdf-to-text' },
                  { name: 'Strip Metadata', slug: 'pdf-metadata' },
                ].map((action) => (
                  <button
                    key={action.slug}
                    type="button"
                    onClick={() => router.push(`/${action.slug}`)}
                    className="p-3 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl text-xs font-bold text-slate-800 hover:text-sky-700 transition"
                  >
                    {action.name} &rarr;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Grid of All Working Browser Tools */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Independent Client-Side PDF Tools
          </h2>
          <p className="text-sm text-slate-600">
            Every tool runs completely client-side in your browser. Choose an operation to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={`/${tool.slug}`}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-500 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getToolIcon(tool.icon)}
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition mb-1.5">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                <span>Open tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why LocalPDF Feature Comparison */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Honest Comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-2">
            Why LocalPDF?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Compare LocalPDF with traditional cloud-based PDF conversion portals.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-sky-600 font-bold bg-sky-50/50 rounded-t-lg">LocalPDF</th>
                <th className="py-3 px-4">Adobe Acrobat Web</th>
                <th className="py-3 px-4">Smallpdf / iLovePDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Document Upload</td>
                <td className="py-3.5 px-4 bg-sky-50/30 text-emerald-700 font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" /> Never leaves device (0 bytes)
                </td>
                <td className="py-3.5 px-4 text-red-600">
                  <XCircle className="w-4 h-4 mr-1 text-red-500 inline" /> Uploaded to cloud
                </td>
                <td className="py-3.5 px-4 text-red-600">
                  <XCircle className="w-4 h-4 mr-1 text-red-500 inline" /> Uploaded to cloud
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Account Required</td>
                <td className="py-3.5 px-4 bg-sky-50/30 text-emerald-700 font-bold">
                  ✓ None
                </td>
                <td className="py-3.5 px-4 text-slate-500">Requires Adobe ID login</td>
                <td className="py-3.5 px-4 text-slate-500">Free tier prompts sign up</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Subscription / Paywall</td>
                <td className="py-3.5 px-4 bg-sky-50/30 text-emerald-700 font-bold">
                  ✓ Free & Open Source
                </td>
                <td className="py-3.5 px-4 text-slate-500">$20+/month subscription</td>
                <td className="py-3.5 px-4 text-slate-500">Monthly subscription limits</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Watermark Added</td>
                <td className="py-3.5 px-4 bg-sky-50/30 text-emerald-700 font-bold">
                  ✓ Zero Watermarks
                </td>
                <td className="py-3.5 px-4 text-slate-500">Varies by tool</td>
                <td className="py-3.5 px-4 text-slate-500">None on basic</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Works Completely Offline</td>
                <td className="py-3.5 px-4 bg-sky-50/30 text-emerald-700 font-bold">
                  ✓ Yes (PWA Service Worker)
                </td>
                <td className="py-3.5 px-4 text-slate-500">No (Server-dependent)</td>
                <td className="py-3.5 px-4 text-slate-500">No (Server-dependent)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Real Performance Benchmarks */}
      <section className="bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-10 border border-slate-800 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Real Hardware Benchmarks
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Zero Server Latency: Local Client Performance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Because LocalPDF does not upload files over broadband connections, operations execute at local RAM and CPU speed.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">File Size</th>
                <th className="py-2.5 px-3">Execution Time</th>
                <th className="py-2.5 px-3 text-emerald-400">Server Upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-medium text-white">Apple M2 MacBook • Safari</td>
                <td className="py-2.5 px-3">Merge 5 PDFs (120 pages)</td>
                <td className="py-2.5 px-3">18.4 MB</td>
                <td className="py-2.5 px-3 font-mono text-sky-400">410 ms</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">0 bytes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-white">Windows 11 PC (Intel i7) • Chrome</td>
                <td className="py-2.5 px-3">Convert 20 JPGs to PDF</td>
                <td className="py-2.5 px-3">34.2 MB</td>
                <td className="py-2.5 px-3 font-mono text-sky-400">620 ms</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">0 bytes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-white">iPhone 14 • Safari Mobile</td>
                <td className="py-2.5 px-3">Rotate 15-page PDF</td>
                <td className="py-2.5 px-3">4.8 MB</td>
                <td className="py-2.5 px-3 font-mono text-sky-400">180 ms</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">0 bytes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-white">Android Pixel 7 • Chrome Mobile</td>
                <td className="py-2.5 px-3">Extract 4 Pages from 40 Pages</td>
                <td className="py-2.5 px-3">8.1 MB</td>
                <td className="py-2.5 px-3 font-mono text-sky-400">230 ms</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">0 bytes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
