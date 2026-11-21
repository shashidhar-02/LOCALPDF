import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import JpgToPdfTool from '@/components/tools/JpgToPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Image to PDF - Free Browser Converter',
  description:
    'Convert photos and images into a PDF document directly on your device. No file uploads, no watermarks, 100% private.',
  alternates: {
    canonical: 'https://localpdf.app/image-to-pdf',
  },
};

export default function ImageToPdfPage() {
  const tool = getToolBySlug('jpg-to-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <JpgToPdfTool />
    </ToolLayout>
  );
}
