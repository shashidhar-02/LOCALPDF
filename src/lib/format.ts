/**
 * Format raw byte size into human readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedIndex = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, clampedIndex)).toFixed(dm))} ${sizes[clampedIndex]}`;
}

/**
 * Calculates percentage savings between original and new size.
 */
export function calculateSavings(originalBytes: number, newBytes: number): number {
  if (!originalBytes || originalBytes <= 0) return 0;
  const diff = originalBytes - newBytes;
  return Math.round((diff / originalBytes) * 100);
}

/**
 * Sanitizes file name for download, stripping hazardous path characters.
 */
export function sanitizeFileName(name: string, fallback: string = 'document.pdf'): string {
  if (!name) return fallback;
  const base = name.split(/[/\\]/).pop() || fallback;
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  const finalName = clean || 'document';
  return finalName.endsWith('.pdf') ? finalName : `${finalName}.pdf`;
}
