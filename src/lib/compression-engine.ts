import { PDFDocument } from 'pdf-lib';
import { CompressionOptions, CompressionResult } from './types';
import { calculateSavings } from './format';
import { loadPdfDocument, renderPdfPageToCanvas } from './pdf-viewer-helper';

/**
 * Client-side PDF compression engine with honest reporting.
 *
 * Mode 1: 'lossless'
 * Re-saves the document using object streams and stripped unreferenced objects.
 * Best for documents that have never been compacted.
 *
 * Mode 2: 'raster'
 * Converts pages to images at specified JPEG quality and DPI scale, then rebuilds PDF.
 * Explicitly alerts the user: "This may change selectable text and document fidelity."
 */
export async function compressPdfDocument(
  fileBytes: Uint8Array,
  options: CompressionOptions,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<CompressionResult> {
  const originalBytes = fileBytes.length;

  if (options.mode === 'lossless') {
    onProgress?.(1, 1, 'Optimizing PDF object streams...');
    const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const compressedBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const newBytes = compressedBytes.length;
    const savings = calculateSavings(originalBytes, newBytes);

    let warning: string | undefined;
    if (newBytes >= originalBytes) {
      warning =
        'This PDF is already heavily optimized. Re-saving resulted in no size reduction. The original file was kept to prevent size increase.';
    }

    return {
      originalBytes,
      newBytes: newBytes < originalBytes ? newBytes : originalBytes,
      savingsPercent: Math.max(0, savings),
      pdfData: newBytes < originalBytes ? compressedBytes : fileBytes,
      modeUsed: 'Lossless Structure Optimization',
      warning,
    };
  }

  // Rasterized / Image-Heavy compression mode
  onProgress?.(0, 1, 'Initializing page rasterizer...');
  const pdfDoc = await loadPdfDocument(fileBytes);
  const totalPages = pdfDoc.numPages;

  const newDoc = await PDFDocument.create();
  const canvas = document.createElement('canvas');

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages, `Compressing page ${i} of ${totalPages}...`);
    // Render page to canvas with downscaling factor
    const { width, height } = await renderPdfPageToCanvas(pdfDoc, i, canvas, options.scale);

    // Convert canvas to compressed JPEG
    const jpegDataUrl = canvas.toDataURL('image/jpeg', options.imageQuality);
    const jpegBytes = await fetch(jpegDataUrl).then((r) => r.arrayBuffer());

    const embeddedImage = await newDoc.embedJpg(jpegBytes);
    // Page dimensions in PDF points
    const page = newDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  // Clean canvas
  canvas.width = 0;
  canvas.height = 0;

  onProgress?.(totalPages, totalPages, 'Finalizing compressed document...');
  const newBytesArray = await newDoc.save({ useObjectStreams: true });
  const newBytes = newBytesArray.length;
  const savings = calculateSavings(originalBytes, newBytes);

  let warning = 'Notice: Rasterized compression converted pages to images. Selectable text may no longer be highlightable.';
  if (newBytes >= originalBytes) {
    warning += ' Furthermore, the compressed file turned out larger than original. You may prefer the original file.';
  }

  return {
    originalBytes,
    newBytes,
    savingsPercent: savings,
    pdfData: newBytesArray,
    modeUsed: `Rasterized Compression (Quality ${Math.round(options.imageQuality * 100)}%)`,
    warning,
  };
}
