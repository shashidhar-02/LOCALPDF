import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight, Smartphone, Minimize2, Image as ImageIcon, PenTool, Scissors, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PDF Guides & Problem-Solving Tutorials - LocalPDF',
  description:
    'Genuinely useful guides on merging on Android, compressing without uploading, offline signing, and understanding PDF file sizes.',
  alternates: {
    canonical: 'https://localpdf.app/guides',
  },
};

const GUIDES = [
  {
    slug: 'merge-pdf-on-android',
    title: 'How to Merge PDF Files on Android Without Installing Apps',
    desc: 'Combine multiple downloads, receipts, or forms directly in Android Chrome with zero cloud upload and no sketchy Play Store ads.',
    icon: Smartphone,
    toolSlug: 'merge-pdf',
    toolName: 'Open Merge Tool',
  },
  {
    slug: 'compress-pdf-without-uploading',
    title: 'How to Compress a PDF Without Uploading It to the Cloud',
    desc: 'Keep private tax forms, medical records, and bank statements on your own device while shrinking file size for email limits.',
    icon: Minimize2,
    toolSlug: 'compress-pdf',
    toolName: 'Open Compress Tool',
  },
  {
    slug: 'combine-jpg-photos-into-pdf',
    title: 'How to Combine JPG and PNG Photos into One Clean PDF',
    desc: 'Convert multiple phone camera snapshots or document scans into a single standardized A4 or Letter PDF.',
    icon: ImageIcon,
    toolSlug: 'jpg-to-pdf',
    toolName: 'Open JPG to PDF Tool',
  },
  {
    slug: 'sign-pdf-without-printing',
    title: 'How to Sign a PDF Document Without Printing and Scanning',
    desc: 'Draw or type your signature on your phone or laptop touchscreen and embed it directly into the PDF.',
    icon: PenTool,
    toolSlug: 'sign-pdf',
    toolName: 'Open Sign Tool',
  },
  {
    slug: 'split-selected-pages-from-pdf',
    title: 'How to Split Selected Pages from a Multi-Page PDF',
    desc: 'Extract only pages 1, 3, and 5-8 into a separate PDF document in seconds using client-side ranges.',
    icon: Scissors,
    toolSlug: 'extract-pdf-pages',
    toolName: 'Open Extract Pages Tool',
  },
  {
    slug: 'why-pdf-becomes-larger-after-compression',
    title: 'Why Does My PDF Become Larger After Compression?',
    desc: 'A transparent technical explanation of FlateDecode, vector fonts, and why converting text to raster images increases byte size.',
    icon: AlertTriangle,
    toolSlug: 'compress-pdf',
    toolName: 'Try Honest Compression',
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-sky-50 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-full border border-sky-200 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
          <span>Practical Problem-Solving</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          LocalPDF Step-by-Step Guides
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Clear, honest, actionable guides connected directly to working browser tools. No ad-choked fluff or competitor scraping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDES.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.slug}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-sky-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {g.title}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {g.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold">
                <Link href={`/guides/${g.slug}`} className="text-slate-700 hover:text-slate-900">
                  Read Guide &rarr;
                </Link>
                <Link
                  href={`/${g.toolSlug}`}
                  className="text-sky-600 hover:text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded-lg"
                >
                  {g.toolName}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
