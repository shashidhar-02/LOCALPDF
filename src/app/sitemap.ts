import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://localpdf.app';
  const lastModified = new Date();

  // Root and informational pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/architecture`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/benchmarks`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  // Tool routes
  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Guide routes
  const guideSlugs = [
    'merge-pdf-on-android',
    'compress-pdf-without-uploading',
    'combine-jpg-photos-into-pdf',
    'sign-pdf-without-printing',
    'split-selected-pages-from-pdf',
    'why-pdf-becomes-larger-after-compression',
  ];

  const guideRoutes: MetadataRoute.Sitemap = guideSlugs.map((slug) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes, ...guideRoutes];
}
