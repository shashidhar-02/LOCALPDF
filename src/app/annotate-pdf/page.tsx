import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import AnnotatePdfTool from '@/components/tools/AnnotatePdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Annotate PDF - Add Text Notes, Highlights & Shapes',
  description:
    'Annotate PDF files in your browser. Add text comments, highlights, rectangles, and strikethroughs directly without cloud upload.',
  alternates: {
    canonical: 'https://localpdf.app/annotate-pdf',
  },
};

export default function AnnotatePdfPage() {
  const tool = getToolBySlug('annotate-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <AnnotatePdfTool />
    </ToolLayout>
  );
}
