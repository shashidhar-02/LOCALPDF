/**
 * Safe, lazy-loaded PDF.js helper for page thumbnail rendering,
 * full-page viewing, and text extraction.
 *
 * Security notice:
 * `isEvalSupported: false` is explicitly passed to disable PDF JavaScript execution.
 */

let pdfjsLibInstance: any = null;

export async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be loaded in the browser.');
  }

  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    // Set worker source securely
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
    }
    pdfjsLibInstance = pdfjs;
  }

  return pdfjsLibInstance;
}

/**
 * Loads a PDF document safely with evaluation disabled
 */
export async function loadPdfDocument(fileBytes: Uint8Array) {
  const pdfjs = await getPdfJs();
  // Copy to slice to prevent memory detach issues
  const data = fileBytes.slice(0);
  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false, // Security: Disable PDF JavaScript eval
    disableRange: true,
    disableStream: true,
  });

  return await loadingTask.promise;
}

/**
 * Renders a specific PDF page onto an HTMLCanvasElement
 */
export async function renderPdfPageToCanvas(
  pdfDoc: any,
  pageNumber: number, // 1-based
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D context from canvas');

  // Handle High-DPI screens
  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  context.save();
  context.scale(outputScale, outputScale);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  context.restore();

  return { width: viewport.width, height: viewport.height };
}

/**
 * Renders a page to a PNG data URL (useful for thumbnails)
 */
export async function renderPageThumbnail(
  pdfDoc: any,
  pageNumber: number,
  targetWidth: number = 200
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) return '';

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  // Clean up
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

/**
 * Extracts plain text from all or specific pages of a PDF
 */
export async function extractPdfText(
  fileBytes: Uint8Array,
  onProgress?: (current: number, total: number) => void
): Promise<{ fullText: string; pageTexts: { page: number; text: string }[] }> {
  const pdfDoc = await loadPdfDocument(fileBytes);
  const totalPages = pdfDoc.numPages;
  const pageTexts: { page: number; text: string }[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str || '');
    const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();
    pageTexts.push({ page: i, text: pageText });
    if (onProgress) onProgress(i, totalPages);
  }

  const fullText = pageTexts.map((p) => `--- Page ${p.page} ---\n\n${p.text}`).join('\n\n');
  return { fullText, pageTexts };
}
