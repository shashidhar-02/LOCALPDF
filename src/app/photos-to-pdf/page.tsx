import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import JpgToPdfTool from '@/components/tools/JpgToPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Photos to PDF - Combine Pictures into PDF',
  description:
    'Combine photos from your phone or PC into one PDF file. Reorder pages and adjust margins without uploading to any server.',
  alternates: {
    canonical: 'https://localpdf.app/photos-to-pdf',
  },
};

export default function PhotosToPdfPage() {
  const tool = getToolBySlug('jpg-to-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <JpgToPdfTool />
    </ToolLayout>
  );
}
