/**
 * Safe, lazy-loaded PDF.js helper for page thumbnail rendering,
 * full-page viewing, and text extraction.
 *
 * Security notice:
 * `isEvalSupported: false` is explicitly passed to disable PDF JavaScript execution.
 */

import { DetectedPdfTextItem, StandardFontFamily } from './types';

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

/**
 * In-memory LRU render cache for rapid, zero-latency page transitions.
 */
interface CachedRender {
  canvasDataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

const renderCache = new Map<string, CachedRender>();
const MAX_CACHE_ENTRIES = 40;

export function getCachedPageRender(
  docFingerprint: string,
  pageNumber: number,
  scale: number
): CachedRender | undefined {
  const key = `${docFingerprint}_${pageNumber}_${scale.toFixed(2)}`;
  const item = renderCache.get(key);
  if (item) {
    item.timestamp = Date.now();
  }
  return item;
}

export function setCachedPageRender(
  docFingerprint: string,
  pageNumber: number,
  scale: number,
  render: Omit<CachedRender, 'timestamp'>
) {
  if (renderCache.size >= MAX_CACHE_ENTRIES) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of renderCache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) renderCache.delete(oldestKey);
  }
  const key = `${docFingerprint}_${pageNumber}_${scale.toFixed(2)}`;
  renderCache.set(key, { ...render, timestamp: Date.now() });
}

export function clearRenderCache() {
  renderCache.clear();
}

/**
 * Extracts positioned text blocks from a page for Adobe Pro-style
 * auto-detection and click-to-edit text in place.
 */
export async function extractPageTextItems(
  pdfDoc: any,
  pageNumber: number
): Promise<DetectedPdfTextItem[]> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent({ includeMarkedContent: true });
    const items: DetectedPdfTextItem[] = [];

    for (let idx = 0; idx < textContent.items.length; idx++) {
      const it = textContent.items[idx];
      if (!it.str || it.str.trim().length === 0) continue;

      // Transform matrix: [scaleX, skewY, skewX, scaleY, transX, transY]
      const transX = it.transform[4];
      const transY = it.transform[5];
      const fontSize = Math.round(Math.abs(it.transform[0] || it.transform[3] || 12));
      const width = Math.round(it.width || it.str.length * fontSize * 0.55);
      const height = Math.round(it.height || fontSize * 1.25);

      // In PDF coordinates, transY is from bottom of page. Convert to top-left coordinates:
      const x = Math.round(transX);
      const y = Math.round(viewport.height - transY - fontSize);

      let fontFamily: StandardFontFamily = 'Helvetica';
      const fn = (it.fontName || '').toLowerCase();
      if (fn.includes('time') || fn.includes('serif') || fn.includes('roman')) {
        fontFamily = 'Times-Roman';
      } else if (fn.includes('cour') || fn.includes('mono')) {
        fontFamily = 'Courier';
      }

      items.push({
        id: `detected_${pageNumber}_${idx}`,
        str: it.str,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(12, width),
        height: Math.max(12, height),
        fontSize: Math.max(8, fontSize),
        fontFamily,
        pageNumber,
      });
    }

    return items;
  } catch (err) {
    console.warn('Text detection failed for page', pageNumber, err);
    return [];
  }
}


