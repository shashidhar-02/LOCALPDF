import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import JpgToPdfTool from '@/components/tools/JpgToPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'JPG to PDF - Convert Images to PDF in Browser',
  description:
    'Convert JPG, PNG, and WebP photos into a single PDF document locally. Reorder, choose A4 or Letter, set margins, completely free and private.',
  alternates: {
    canonical: 'https://localpdf.app/jpg-to-pdf',
  },
};

export default function JpgToPdfPage() {
  const tool = getToolBySlug('jpg-to-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <JpgToPdfTool />
    </ToolLayout>
  );
}
