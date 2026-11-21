import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import SplitPdfTool from '@/components/tools/SplitPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Split PDF Pages - Extract Ranges and Single Pages',
  description:
    'Split PDF into individual pages, custom page ranges, or odd and even pages. 100% browser-based with zero file uploads.',
  alternates: {
    canonical: 'https://localpdf.app/split-pdf',
  },
};

export default function SplitPdfPage() {
  const tool = getToolBySlug('split-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <SplitPdfTool />
    </ToolLayout>
  );
}
