import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://localpdf.app'),
  title: {
    default: 'LocalPDF - Free, Private, Instant PDF Tools',
    template: '%s | LocalPDF',
  },
  description:
    '100% browser-only PDF utility suite. Merge, split, compress, sign, and convert PDFs directly on your device. No uploads, no account, no watermarks, completely private.',
  keywords: [
    'local pdf',
    'private pdf editor',
    'browser pdf merge',
    'compress pdf locally',
    'offline pdf tools',
    'sign pdf in browser',
    'jpg to pdf converter',
    'no upload pdf tools',
  ],
  authors: [{ name: 'LocalPDF Team' }],
  creator: 'LocalPDF',
  publisher: 'LocalPDF',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://localpdf.app',
    siteName: 'LocalPDF',
    title: 'LocalPDF - Your PDF stays on your device.',
    description:
      'Free, private, instant PDF tools that run entirely in your browser. No server uploads, no accounts, no subscriptions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalPDF - Browser-Only PDF Utility Suite',
    description: 'Your PDF stays on your device. Free, private, instant PDF tools.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0284c7" />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
