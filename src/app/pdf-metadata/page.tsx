import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import PdfMetadataTool from '@/components/tools/PdfMetadataTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'PDF Metadata Editor - View, Edit & Strip Metadata',
  description:
    'Inspect, edit, and strip identifying metadata tags (author, title, creation date, software) from PDF files for privacy.',
  alternates: {
    canonical: 'https://localpdf.app/pdf-metadata',
  },
};

export default function PdfMetadataPage() {
  const tool = getToolBySlug('pdf-metadata');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PdfMetadataTool />
    </ToolLayout>
  );
}
