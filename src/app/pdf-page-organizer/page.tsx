import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import PageOrganizerTool from '@/components/tools/PageOrganizerTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'PDF Page Organizer - Reorder, Rotate & Delete Pages',
  description:
    'Interactive visual PDF page organizer. View thumbnails, drag to reorder pages, delete unneeded sheets, and rotate individual pages.',
  alternates: {
    canonical: 'https://localpdf.app/pdf-page-organizer',
  },
};

export default function PageOrganizerPage() {
  const tool = getToolBySlug('pdf-page-organizer');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PageOrganizerTool />
    </ToolLayout>
  );
}
