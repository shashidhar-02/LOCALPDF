import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import ProtectPdfTool from '@/components/tools/ProtectPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'PDF Security & Password Assessment',
  description:
    'Inspect PDF security state and understand standard AES-256 client-side cryptography without fake security claims.',
  alternates: {
    canonical: 'https://localpdf.app/protect-pdf',
  },
};

export default function ProtectPdfPage() {
  const tool = getToolBySlug('protect-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <ProtectPdfTool />
    </ToolLayout>
  );
}
