import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import RotatePdfTool from '@/components/tools/RotatePdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Rotate PDF - Permanently Rotate PDF Pages 90°, 180°, 270°',
  description:
    'Permanently rotate upside-down or sideways PDF pages. Rotate all pages or target specific page numbers in your browser.',
  alternates: {
    canonical: 'https://localpdf.app/rotate-pdf',
  },
};

export default function RotatePdfPage() {
  const tool = getToolBySlug('rotate-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <RotatePdfTool />
    </ToolLayout>
  );
}
