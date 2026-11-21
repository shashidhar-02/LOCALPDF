import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import WatermarkPdfTool from '@/components/tools/WatermarkPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Watermark PDF Online — Add Confidential, Draft & Custom Watermarks Free',
  description:
    'Add text watermarks to all PDF pages in your browser. Choose opacity, rotation, and presets like CONFIDENTIAL or DRAFT. 100% private, no uploads.',
  alternates: {
    canonical: 'https://localpdf.dev/watermark-pdf',
  },
};

export default function WatermarkPdfPage() {
  const tool = getToolBySlug('watermark-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <WatermarkPdfTool />
    </ToolLayout>
  );
}
