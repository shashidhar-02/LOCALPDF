import { Metadata } from 'next';
import ToolLayout from '@/components/common/ToolLayout';
import SignPdfTool from '@/components/tools/SignPdfTool';
import { getToolBySlug } from '@/lib/tools-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign PDF Online - Draw, Type & Place Visual Signature',
  description:
    'Add a clean visual signature to any PDF document. Draw on touchscreen, type cursive signature, or upload image stamp.',
  alternates: {
    canonical: 'https://localpdf.app/sign-pdf',
  },
};

export default function SignPdfPage() {
  const tool = getToolBySlug('sign-pdf');
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <SignPdfTool />
    </ToolLayout>
  );
}
