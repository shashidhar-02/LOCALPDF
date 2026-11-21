import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import FillPdfTool from '@/components/tools/FillPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Fill PDF Forms Online - Free Interactive Form Filler',
  description:
    'Fill standard AcroForm PDF form fields and checkboxes in your browser. Save and download completed documents instantly.',
  alternates: {
    canonical: 'https://localpdf.app/fill-pdf',
  },
};

export default function FillPdfPage() {
  const tool = getToolBySlug('fill-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <FillPdfTool />
    </ToolLayout>
  );
}
