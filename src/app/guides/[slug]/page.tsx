import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PrivacyBanner from '@/components/common/PrivacyBanner';

interface GuideData {
  title: string;
  desc: string;
  toolSlug: string;
  toolTitle: string;
  content: { heading: string; text: string; steps?: string[] }[];
}

const GUIDE_CONTENT: Record<string, GuideData> = {
  'merge-pdf-on-android': {
    title: 'How to Merge PDF Files on Android Without Installing Apps',
    desc: 'Combine multiple PDF downloads, bank statements, or forms directly in Android Chrome or Samsung Internet without risking your documents on third-party servers.',
    toolSlug: 'merge-pdf',
    toolTitle: 'Merge PDF Online',
    content: [
      {
        heading: 'The Android App Store Privacy Problem',
        text: 'Most PDF merger apps on the Google Play Store are ad-supported wrappers that secretly upload your files to remote cloud servers for conversion. This exposes private invoices, medical charts, and tax returns to data leakage.',
      },
      {
        heading: 'How to Combine Files Locally in 3 Steps',
        text: 'With LocalPDF, your phone processor does the work directly in Android Chrome using WebAssembly.',
        steps: [
          'Open LocalPDF Merge in Chrome on your Android device.',
          'Tap "Select 2 or more PDF files" and pick files from your Downloads or Files app.',
          'Tap "Merge PDFs" to combine all pages into one file and download immediately.',
        ],
      },
    ],
  },
  'compress-pdf-without-uploading': {
    title: 'How to Compress a PDF Without Uploading It to the Cloud',
    desc: 'Reduce file size for strict email limits (such as Gmail’s 25 MB cap) while keeping your document safely in your browser.',
    toolSlug: 'compress-pdf',
    toolTitle: 'Compress PDF Online',
    content: [
      {
        heading: 'Why Uploading Sensitive PDFs is a Security Risk',
        text: 'Government agencies, embassies, and HR departments routinely cap attachment sizes at 5MB or 10MB. Rushing to upload private passport scans or salary slips to unknown online compression sites is dangerous.',
      },
      {
        heading: 'Client-Side Compression Mechanics',
        text: 'LocalPDF compresses PDF files directly on your machine. You can choose Lossless Structure Optimization (compacting stream dictionaries and removing unreferenced font subsets) or Rasterized Compression for large scans.',
        steps: [
          'Drop your PDF into the LocalPDF Compress tool.',
          'Select "Lossless Structure Optimization" to maintain 100% crisp text.',
          'Review the real before-and-after size comparison and download.',
        ],
      },
    ],
  },
  'combine-jpg-photos-into-pdf': {
    title: 'How to Combine JPG and PNG Photos into One Clean PDF',
    desc: 'Turn phone camera pictures, receipts, or handwritten homework into a professional multi-page PDF.',
    toolSlug: 'jpg-to-pdf',
    toolTitle: 'JPG to PDF Converter',
    content: [
      {
        heading: 'Creating Professional PDFs from Camera Pictures',
        text: 'Sending raw camera JPGs by email looks unprofessional and photos often open in random orientations. Combining them into an A4 or Letter PDF ensures all recipients view them in proper sequence.',
      },
      {
        heading: 'Step-by-Step Instructions',
        text: 'Follow these simple steps to build your PDF in seconds:',
        steps: [
          'Select your photos or drag them into LocalPDF.',
          'Use the arrow buttons to arrange the desired order of pages.',
          'Choose your target paper size (A4, Letter, or Fit to Image) and margins.',
          'Click "Convert to PDF" and download your finished document.',
        ],
      },
    ],
  },
  'sign-pdf-without-printing': {
    title: 'How to Sign a PDF Document Without Printing and Scanning',
    desc: 'Sign contracts, lease agreements, and permission slips electronically without wasting paper or printer toner.',
    toolSlug: 'sign-pdf',
    toolTitle: 'Sign PDF Online',
    content: [
      {
        heading: 'Visual Signature vs. Cryptographic Certificates',
        text: 'Most everyday signing tasks—such as signing a rental agreement, NDAs, or freelance work orders—require a visual signature stamp. You do not need to print, sign with a pen, and re-scan the paper.',
      },
      {
        heading: 'How to Sign in LocalPDF',
        text: 'Sign directly with your mouse or touchscreen:',
        steps: [
          'Open your document in the LocalPDF Sign tool.',
          'Draw your signature with your mouse or finger, or type your name in cursive.',
          'Position and resize the signature stamp on the desired page.',
          'Click "Download Signed PDF" to save the stamped copy locally.',
        ],
      },
    ],
  },
  'split-selected-pages-from-pdf': {
    title: 'How to Split Selected Pages from a Multi-Page PDF',
    desc: 'Extract only the exact pages you need from a large manual, eBook, or report without downloading desktop software.',
    toolSlug: 'extract-pdf-pages',
    toolTitle: 'Extract PDF Pages',
    content: [
      {
        heading: 'Isolating Key Pages',
        text: 'If you have a 100-page bank report and only need to share pages 3 and 12-15 with your accountant, extracting them preserves privacy and reduces file weight.',
      },
      {
        heading: 'How to Extract Specific Pages',
        text: 'Use flexible range syntax or visual thumbnail selection:',
        steps: [
          'Drop your PDF into LocalPDF Extract Pages.',
          'Type your desired range (e.g. "1, 3, 5-8") or click directly on the page thumbnails.',
          'Click "Extract Pages" to create a new PDF containing only those sheets.',
        ],
      },
    ],
  },
  'why-pdf-becomes-larger-after-compression': {
    title: 'Why Does My PDF Become Larger After Compression?',
    desc: 'The technical reason why compressing an already-optimized PDF can increase file size, and why LocalPDF never lies about savings.',
    toolSlug: 'compress-pdf',
    toolTitle: 'Compress PDF Online',
    content: [
      {
        heading: 'How PDF Compression Actually Works',
        text: 'Modern PDFs already use Deflate / FlateDecode algorithms to compress internal text and vector graphics. If a document consists primarily of text and vector fonts, there is almost no redundant data to compress.',
      },
      {
        heading: 'The Rasterization Trap',
        text: 'Many online compressors "compress" PDFs by rendering each page as an image. But converting crisp vector fonts into high-resolution bitmap pixels often takes MORE bytes than the original vector instructions! That is why LocalPDF checks file sizes honestly: if an operation would make your file larger, LocalPDF warns you and preserves your original file.',
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(GUIDE_CONTENT).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const data = GUIDE_CONTENT[slug];
    if (!data) return { title: 'Guide Not Found' };
    return {
      title: `${data.title} - LocalPDF Guide`,
      description: data.desc,
      alternates: {
        canonical: `https://localpdf.app/guides/${slug}`,
      },
    };
  });
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_CONTENT[slug];
  if (!guide) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <Link
          href="/guides"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Guides</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
          {guide.title}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          {guide.desc}
        </p>
      </div>

      <PrivacyBanner />

      {/* Tool Callout */}
      <div className="p-4 sm:p-5 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Ready to do this now?</span>
          <h2 className="text-sm font-bold text-slate-900 mt-0.5">Use our free client-side tool</h2>
        </div>
        <Link
          href={`/${guide.toolSlug}`}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
        >
          <span>{guide.toolTitle}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed border-t border-slate-200 pt-6">
        {guide.content.map((sec, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {sec.heading}
            </h2>
            <p>{sec.text}</p>
            {sec.steps && (
              <ol className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-800 font-medium">
                {sec.steps.map((st, sidx) => (
                  <li key={sidx} className="flex items-start">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                      {sidx + 1}
                    </span>
                    <span className="leading-relaxed">{st}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
