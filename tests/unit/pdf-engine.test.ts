import { describe, it, expect } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  mergePDFs,
  splitPDF,
  extractPages,
  rotatePDF,
  reorderAndModifyPages,
  readPDFMetadata,
  updatePDFMetadata,
  stripPDFMetadata,
  getPDFPageCount
} from '@/lib/pdf-engine';

// Helper to create a dummy test PDF with specified number of pages
async function createTestPDF(pageCount: number = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Page ${i + 1}`);
  }
  return await doc.save();
}

describe('Core PDF Engine (Client-Side pdf-lib Operations)', () => {
  it('accurately counts pages in a PDF document', async () => {
    const pdfData = await createTestPDF(4);
    const count = await getPDFPageCount(pdfData);
    expect(count).toBe(4);
  });

  it('merges multiple PDF documents in specified sequence', async () => {
    const pdf1 = await createTestPDF(2);
    const pdf2 = await createTestPDF(3);

    const merged = await mergePDFs([pdf1, pdf2]);
    const mergedDoc = await PDFDocument.load(merged);
    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('splits PDF into odd and even pages', async () => {
    const testPdf = await createTestPDF(4);

    const oddSplit = await splitPDF(testPdf, { mode: 'odd' });
    expect(oddSplit).toHaveLength(1);
    const oddDoc = await PDFDocument.load(oddSplit[0].data);
    expect(oddDoc.getPageCount()).toBe(2);

    const evenSplit = await splitPDF(testPdf, { mode: 'even' });
    expect(evenSplit).toHaveLength(1);
    const evenDoc = await PDFDocument.load(evenSplit[0].data);
    expect(evenDoc.getPageCount()).toBe(2);
  });

  it('extracts specific pages into a new PDF document', async () => {
    const testPdf = await createTestPDF(5);
    const extractedBytes = await extractPages(testPdf, [2, 4]);

    const doc = await PDFDocument.load(extractedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it('rotates pages clockwise permanently', async () => {
    const testPdf = await createTestPDF(2);
    const rotated = await rotatePDF(testPdf, 90, [1]);

    const doc = await PDFDocument.load(rotated);
    const pages = doc.getPages();
    expect(pages[0].getRotation().angle).toBe(90);
    expect(pages[1].getRotation().angle).toBe(0);
  });

  it('reorders and deletes pages according to organizer instructions', async () => {
    const testPdf = await createTestPDF(4);
    // Reverse order: Page 4, Page 3, Page 2, Page 1
    const organized = await reorderAndModifyPages(testPdf, [
      { originalIndex: 3 },
      { originalIndex: 2 },
      { originalIndex: 1 },
      { originalIndex: 0 },
    ]);

    const doc = await PDFDocument.load(organized);
    expect(doc.getPageCount()).toBe(4);
  });

  it('reads, updates, and strips metadata', async () => {
    const testPdf = await createTestPDF(1);

    const updated = await updatePDFMetadata(testPdf, {
      title: 'Confidential Strategy',
      author: 'Security Team',
      keywords: 'secret, internal, 2026',
    });

    const meta = await readPDFMetadata(updated);
    expect(meta.title).toBe('Confidential Strategy');
    expect(meta.author).toBe('Security Team');
    expect(meta.keywords).toContain('secret');

    // Strip metadata
    const stripped = await stripPDFMetadata(updated);
    const strippedMeta = await readPDFMetadata(stripped);
    expect(strippedMeta.title).toBe('');
    expect(strippedMeta.author).toBe('');
    expect(strippedMeta.keywords).toBe('');
  });
});
