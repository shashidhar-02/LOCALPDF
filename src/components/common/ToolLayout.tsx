'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, HelpCircle, AlertTriangle, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { ToolMeta } from '@/lib/types';
import PrivacyBanner from './PrivacyBanner';
import { TOOLS } from '@/lib/tools-data';

interface ToolLayoutProps {
  tool: ToolMeta;
  children: React.ReactNode;
}

export default function ToolLayout({ tool, children }: ToolLayoutProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Schema.org structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `LocalPDF - ${tool.title}`,
    operatingSystem: 'Any (Browser-based: Chrome, Safari, Firefox, Edge)',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: tool.description,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const relatedTools = TOOLS.filter((t) => t.id !== tool.id).slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">{tool.shortTitle}</span>
      </nav>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {tool.title}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          {tool.tagline}
        </p>
      </div>

      {/* Privacy Guarantee Banner */}
      <PrivacyBanner />

      {/* Interactive Tool Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 mb-16">
        {children}
      </div>

      {/* How it Works */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
          How to {tool.shortTitle} Online Without Uploading
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tool.howItWorks.map((step) => (
            <div
              key={step.step}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative flex flex-col"
            >
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center mb-3">
                {step.step}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Explanation & Technical Differentiation */}
      <section className="mb-16 bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-start space-x-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Why LocalPDF is Fundamentally Different
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional online PDF converters require you to upload your sensitive contracts, medical records, or tax forms to their cloud servers. LocalPDF uses client-side WebAssembly, HTML5 Canvas, and modern Web APIs to execute all algorithms inside your browser.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="font-bold text-red-400 mb-2">Cloud Converters (Adobe Web, Smallpdf)</div>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Transmits your full PDF over the internet</li>
              <li>• Stores files in third-party cloud storage</li>
              <li>• Subject to server queues and bandwidth limits</li>
              <li>• Enforces subscription paywalls and daily limits</li>
            </ul>
          </div>

          <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/40">
            <div className="font-bold text-emerald-400 mb-2">LocalPDF (Pure Browser)</div>
            <ul className="space-y-1.5 text-slate-300">
              <li>✓ 0 bytes of your PDF leave your computer</li>
              <li>✓ Instant local processing with zero server lag</li>
              <li>✓ Works completely offline without internet</li>
              <li>✓ 100% free with no watermarks and no accounts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Limitations & Honest Expectations */}
      <section className="mb-16 bg-amber-50/60 border border-amber-200/80 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Browser Limits & Technical Considerations</span>
        </div>
        <ul className="space-y-2 text-xs text-amber-950/80">
          {tool.limitations.map((limit, i) => (
            <li key={i} className="flex items-start">
              <span className="mr-2 text-amber-500">•</span>
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Frequently Asked Questions */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          {tool.faqs.map((faq, idx) => (
            <div key={idx} className="p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-900 text-sm hover:text-sky-600 transition"
                aria-expanded={openFaq === idx}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-sky-600' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="mt-3 text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related Tools */}
      <section className="pt-8 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Other Free Browser Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {relatedTools.map((rt) => (
            <Link
              key={rt.id}
              href={`/${rt.slug}`}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-500 hover:shadow-sm transition group"
            >
              <div className="font-semibold text-slate-900 text-xs group-hover:text-sky-600 mb-1">
                {rt.shortTitle}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1">
                {rt.tagline}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
