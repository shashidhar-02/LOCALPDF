import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Server, Shield, CheckCircle2, AlertCircle, Terminal, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Architecture & Proof - LocalPDF',
  description:
    'Detailed technical privacy explanation. Learn how LocalPDF guarantees that your PDF files never leave your browser.',
  alternates: {
    canonical: 'https://localpdf.app/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 mb-3">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Non-Negotiable Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Your Document Stays on Your Device
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          LocalPDF is engineered from the ground up on a zero-upload architecture. Here is exactly how it works and how you can verify it yourself.
        </p>
      </div>

      {/* Difference between hosting and processing */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Server className="w-5 h-5 text-sky-600" />
          <span>Website Hosting vs. Document Processing</span>
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed">
          Many online PDF utilities claim to be &ldquo;secure&rdquo; while silently transmitting your sensitive tax returns, bank statements, or legal contracts to remote cloud processing clusters. LocalPDF makes an absolute separation between website delivery and document processing:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">1. Website Delivery (Vercel)</h3>
            <p className="text-slate-600 leading-relaxed">
              When you load <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">localpdf.app</code>, Vercel acts purely as a static web server. It delivers HTML, CSS, JavaScript, and WebAssembly bundles to your browser.
            </p>
            <p className="text-emerald-700 font-semibold">
              ✓ No server functions exist. No document processing backend is deployed.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">2. Document Processing (Your Browser)</h3>
            <p className="text-emerald-950 leading-relaxed">
              When you drop a PDF or photo, the file is read directly into your computer or smartphone&apos;s local memory using the HTML5 File API and WebAssembly.
            </p>
            <p className="text-emerald-800 font-semibold">
              ✓ All parsing, merging, rotation, signing, and compression execute inside your browser sandbox.
            </p>
          </div>
        </div>
      </section>

      {/* How to verify in DevTools */}
      <section className="bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2.5">
          <Eye className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">
            Verify with Your Own Eyes (DevTools Tutorial)
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          You don&apos;t have to take our word for it. You can independently verify our zero-upload guarantee in under 30 seconds using any modern web browser:
        </p>

        <ol className="space-y-4 text-xs text-slate-300">
          <li className="flex items-start">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center shrink-0 mr-3 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-white block mb-0.5">Open Developer Tools</strong>
              <span>Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">F12</kbd> (or right click and select &ldquo;Inspect&rdquo;) and click on the <strong>Network</strong> tab.</span>
            </div>
          </li>

          <li className="flex items-start">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center shrink-0 mr-3 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-white block mb-0.5">Perform Any PDF Operation</strong>
              <span>Drop a document onto <Link href="/merge-pdf" className="text-sky-400 underline">Merge PDF</Link>, <Link href="/compress-pdf" className="text-sky-400 underline">Compress PDF</Link>, or <Link href="/sign-pdf" className="text-sky-400 underline">Sign PDF</Link> and complete the operation.</span>
            </div>
          </li>

          <li className="flex items-start">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center shrink-0 mr-3 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-white block mb-0.5">Inspect Outbound Network Requests</strong>
              <span>Filter by &ldquo;Fetch/XHR&rdquo; or inspect all outgoing HTTP requests. You will see that <strong>0 bytes of your PDF data are ever transmitted</strong>. No POST requests, no analytics payloads containing file names, and no document streaming.</span>
            </div>
          </li>
        </ol>
      </section>

      {/* Security Promises */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Our Four Privacy Commitments
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">No Server-Side File Storage</strong>
              <span className="text-slate-500">We do not operate databases, S3 buckets, or temporary processing caches.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">No AI Telemetry on Documents</strong>
              <span className="text-slate-500">Document contents are never passed to OpenAI, Anthropic, or external language models.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">No Account Tracking</strong>
              <span className="text-slate-500">No email sign-in, cookies, credit cards, or subscription profiling.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">Automatic Buffer Revocation</strong>
              <span className="text-slate-500">Browser object URLs and temporary ArrayBuffers are revoked when operations conclude.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
