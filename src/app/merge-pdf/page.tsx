import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import MergePdfTool from '@/components/tools/MergePdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Merge PDF Online - Free Client-Side PDF Combiner',
  description:
    'Combine multiple PDF files into one in any order. Fast, private, no file size limits, and your documents never leave your browser.',
  alternates: {
    canonical: 'https://localpdf.app/merge-pdf',
  },
};

export default function MergePdfPage() {
  const tool = getToolBySlug('merge-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <MergePdfTool />
    </ToolLayout>
  );
}
