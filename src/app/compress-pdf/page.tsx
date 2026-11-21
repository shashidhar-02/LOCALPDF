import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import CompressPdfTool from '@/components/tools/CompressPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Compress PDF Online - Free Client-Side PDF Compressor',
  description:
    'Reduce PDF file size locally in your browser. Lossless structure optimization and balanced raster compression with honest size comparison.',
  alternates: {
    canonical: 'https://localpdf.app/compress-pdf',
  },
};

export default function CompressPdfPage() {
  const tool = getToolBySlug('compress-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <CompressPdfTool />
    </ToolLayout>
  );
}
