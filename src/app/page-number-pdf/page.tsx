import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import PageNumberPdfTool from '@/components/tools/PageNumberPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Add Page Numbers to PDF Online — Free Bates Numbering in Browser',
  description:
    'Stamp page numbers and Bates labels onto PDF documents. Select custom format, position (bottom center, bottom right, top right), and numbering style. 100% private.',
  alternates: {
    canonical: 'https://localpdf.dev/page-number-pdf',
  },
};

export default function PageNumberPdfPage() {
  const tool = getToolBySlug('page-number-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PageNumberPdfTool />
    </ToolLayout>
  );
}
