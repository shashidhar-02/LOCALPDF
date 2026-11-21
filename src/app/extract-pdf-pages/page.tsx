import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import ExtractPagesTool from '@/components/tools/ExtractPagesTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Extract PDF Pages - Save Specific Pages to New PDF',
  description:
    'Select and extract specific pages (e.g. 1, 3, 5-8, 10-12) from any PDF file. Interactive thumbnail selection without uploading.',
  alternates: {
    canonical: 'https://localpdf.app/extract-pdf-pages',
  },
};

export default function ExtractPagesPage() {
  const tool = getToolBySlug('extract-pdf-pages');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <ExtractPagesTool />
    </ToolLayout>
  );
}
