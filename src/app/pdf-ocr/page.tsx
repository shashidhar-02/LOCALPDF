import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import PdfOcrTool from '@/components/tools/PdfOcrTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Client-Side PDF OCR - English, Hindi & Telugu Recognition',
  description:
    'Perform local optical character recognition on scanned PDFs and images using WebAssembly. No API calls, 100% private OCR.',
  alternates: {
    canonical: 'https://localpdf.app/pdf-ocr',
  },
};

export default function PdfOcrPage() {
  const tool = getToolBySlug('pdf-ocr');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PdfOcrTool />
    </ToolLayout>
  );
}
