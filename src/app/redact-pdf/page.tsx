import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import RedactPdfTool from '@/components/tools/RedactPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Redact PDF Online — Permanently Blackout Sensitive Text & Data Free',
  description:
    'Legal permanent PDF redaction in your browser. Blackout SSNs, account numbers, and private text with custom redaction labels. Zero server upload, completely private.',
  alternates: {
    canonical: 'https://localpdf.dev/redact-pdf',
  },
};

export default function RedactPdfPage() {
  const tool = getToolBySlug('redact-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <RedactPdfTool />
    </ToolLayout>
  );
}
