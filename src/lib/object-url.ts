/**
 * Safe Object URL manager that tracks created object URLs
 * and revokes them automatically when revoked or on page cleanup
 * to prevent memory leaks in the browser.
 */
class ObjectUrlManager {
  private urls = new Set<string>();

  create(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  createFromBytes(bytes: Uint8Array, mimeType: string = 'application/pdf'): string {
    // Avoid double buffer allocation by referencing byte buffer safely
    const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
    return this.create(blob);
  }

  revoke(url: string | null | undefined): void {
    if (url && this.urls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Error revoking URL:', err);
      }
      this.urls.delete(url);
    }
  }

  revokeAll(): void {
    for (const url of this.urls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.urls.clear();
  }
}

export const objectUrls = new ObjectUrlManager();

/**
 * Triggers a browser download of a file buffer safely.
 */
export function downloadFile(data: Uint8Array | Blob, fileName: string, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
