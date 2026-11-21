import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import EditPdfTool from '@/components/tools/EditPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit PDF Online — Free, Private & Browser-Based PDF Editor',
  description:
    'Edit PDF files directly in your browser. Add text with custom fonts (Helvetica, Times, Courier), erase and replace existing text with matched font styles, insert images, shapes, and stamps. 100% private.',
  alternates: {
    canonical: 'https://localpdf.dev/edit-pdf',
  },
  openGraph: {
    title: 'Edit PDF Online — 100% Private Browser PDF Editor | LocalPDF',
    description: 'Add text, replace or erase existing text with matched fonts, insert images and stamps locally in your browser.',
  },
};

export default function EditPdfPage() {
  const tool = getToolBySlug('edit-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <EditPdfTool />
    </ToolLayout>
  );
}
