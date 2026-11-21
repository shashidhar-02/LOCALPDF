/**
 * Client-side local OCR engine using Tesseract.js.
 * Processes entirely in the browser using WebAssembly and Web Workers.
 * Never uploads document data or images.
 */

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 1
  page: number;
  totalPages: number;
}

export type SupportedOcrLanguage = 'eng' | 'hin' | 'tel';

export const OCR_LANGUAGES: { code: SupportedOcrLanguage; label: string }[] = [
  { code: 'eng', label: 'English (Latin script)' },
  { code: 'hin', label: 'Hindi (Devanagari script - हिन्दी)' },
  { code: 'tel', label: 'Telugu (తెలుగు)' },
];

/**
 * Performs local OCR on a series of canvas or image data URLs
 */
export async function runLocalOcr(
  images: string[],
  lang: SupportedOcrLanguage = 'eng',
  onProgress?: (progress: OcrProgress) => void
): Promise<{ fullText: string; pageResults: { page: number; text: string; confidence: number }[] }> {
  // Dynamically import tesseract.js only when called
  const { createWorker } = await import('tesseract.js');

  onProgress?.({
    status: 'Initializing local OCR worker...',
    progress: 0.05,
    page: 1,
    totalPages: images.length,
  });

  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'loading tesseract core') {
        onProgress?.({
          status: 'Loading local OCR WebAssembly engine...',
          progress: 0.1,
          page: 1,
          totalPages: images.length,
        });
      } else if (m.status === 'loading language traineddata') {
        onProgress?.({
          status: `Downloading OCR language pack (${lang})... (Cached locally)`,
          progress: 0.15 + (m.progress || 0) * 0.15,
          page: 1,
          totalPages: images.length,
        });
      } else if (m.status === 'recognizing text') {
        // Individual page progress
      }
    },
  });

  const pageResults: { page: number; text: string; confidence: number }[] = [];

  for (let i = 0; i < images.length; i++) {
    const pageNum = i + 1;
    onProgress?.({
      status: `Recognizing text on page ${pageNum} of ${images.length}...`,
      progress: (i / images.length) * 0.7 + 0.3,
      page: pageNum,
      totalPages: images.length,
    });

    const ret = await worker.recognize(images[i]);
    pageResults.push({
      page: pageNum,
      text: ret.data.text.trim(),
      confidence: Math.round(ret.data.confidence),
    });
  }

  await worker.terminate();

  onProgress?.({
    status: 'Complete!',
    progress: 1.0,
    page: images.length,
    totalPages: images.length,
  });

  const fullText = pageResults
    .map((p) => `--- OCR Page ${p.page} (Confidence: ${p.confidence}%) ---\n\n${p.text}`)
    .join('\n\n');

  return { fullText, pageResults };
}
