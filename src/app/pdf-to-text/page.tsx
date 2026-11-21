import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import PdfToTextTool from '@/components/tools/PdfToTextTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'PDF to Text & DOCX - Best-Effort Client-Side Export',
  description:
    'Extract text from PDF pages and export to plain text (.txt) or editable Microsoft Word (.docx) directly in your browser.',
  alternates: {
    canonical: 'https://localpdf.app/pdf-to-text',
  },
};

export default function PdfToTextPage() {
  const tool = getToolBySlug('pdf-to-text');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PdfToTextTool />
    </ToolLayout>
  );
}
