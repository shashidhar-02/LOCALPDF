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
  getPDFPageCount,
  applyPdfEdits,
  applyVisualAnnotations,
  rotatePageInPdf,
  deletePageInPdf,
  duplicatePageInPdf,
  insertBlankPageInPdf,
  addWatermarkToDocument,
  addPageNumbersToDocument
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

  it('applies text with standard fonts, whiteout redaction, and shapes via applyPdfEdits', async () => {
    const testPdf = await createTestPDF(2);

    const editedBytes = await applyPdfEdits(testPdf, [
      {
        id: 'edit_1',
        type: 'text',
        pageNumber: 1,
        x: 50,
        y: 100,
        width: 120,
        height: 20,
        text: 'Helvetic Standard Text',
        fontFamily: 'Helvetica',
        fontSize: 14,
        textColor: '#0f172a',
        bold: true,
      },
      {
        id: 'edit_2',
        type: 'text',
        pageNumber: 1,
        x: 50,
        y: 130,
        width: 150,
        height: 20,
        text: 'Times New Roman Serif Text',
        fontFamily: 'Times-Roman',
        fontSize: 12,
        textColor: '#2563eb',
        italic: true,
      },
      {
        id: 'edit_3',
        type: 'whiteout',
        pageNumber: 1,
        x: 50,
        y: 160,
        width: 180,
        height: 30,
        backgroundColor: '#ffffff',
        text: 'Replaced Invoice Total $1,250',
        fontFamily: 'Courier',
        fontSize: 12,
        textColor: '#16a34a',
      },
      {
        id: 'edit_4',
        type: 'rectangle',
        pageNumber: 1,
        x: 40,
        y: 90,
        width: 250,
        height: 120,
        strokeColor: '#dc2626',
        strokeWidth: 2,
      },
      {
        id: 'edit_5',
        type: 'highlight',
        pageNumber: 2,
        x: 20,
        y: 40,
        width: 100,
        height: 16,
        backgroundColor: '#fde047',
        opacity: 0.4,
      },
    ]);

    expect(editedBytes).toBeInstanceOf(Uint8Array);
    expect(editedBytes.length).toBeGreaterThan(testPdf.length);

    const doc = await PDFDocument.load(editedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it('performs Adobe-level in-place page operations (rotate, delete, duplicate, insert blank)', async () => {
    const testPdf = await createTestPDF(3);

    // Rotate page 1 by 90 degrees
    const rotated = await rotatePageInPdf(testPdf, 1, 90);
    const rotDoc = await PDFDocument.load(rotated);
    expect(rotDoc.getPages()[0].getRotation().angle).toBe(90);

    // Duplicate page 2 (total goes from 3 to 4)
    const duplicated = await duplicatePageInPdf(testPdf, 2);
    const dupDoc = await PDFDocument.load(duplicated);
    expect(dupDoc.getPageCount()).toBe(4);

    // Delete page 2 (total goes from 3 to 2)
    const deleted = await deletePageInPdf(testPdf, 2);
    const delDoc = await PDFDocument.load(deleted);
    expect(delDoc.getPageCount()).toBe(2);

    // Insert blank page after page 1 (total goes from 3 to 4)
    const blankInserted = await insertBlankPageInPdf(testPdf, 1);
    const blankDoc = await PDFDocument.load(blankInserted);
    expect(blankDoc.getPageCount()).toBe(4);
  });

  it('applies enterprise watermarks and Bates page numbers across all document pages', async () => {
    const testPdf = await createTestPDF(3);

    // Watermark
    const watermarked = await addWatermarkToDocument(testPdf, 'CONFIDENTIAL');
    expect(watermarked).toBeInstanceOf(Uint8Array);
    expect(watermarked.length).toBeGreaterThan(testPdf.length);

    // Page Numbers
    const numbered = await addPageNumbersToDocument(testPdf, 'bottom-center', 'Page ');
    expect(numbered).toBeInstanceOf(Uint8Array);
    expect(numbered.length).toBeGreaterThan(testPdf.length);
  });

  it('correctly applies visual annotations (highlights, text, rectangles, freehand drawing)', async () => {
    const testPdf = await createTestPDF(2);

    const annotatedBytes = await applyVisualAnnotations(testPdf, [
      {
        id: 'ann_1',
        type: 'highlight',
        pageNumber: 1,
        x: 40,
        y: 60,
        width: 120,
        height: 18,
        color: '#facc15',
        opacity: 0.35,
      },
      {
        id: 'ann_2',
        type: 'text',
        pageNumber: 1,
        x: 40,
        y: 100,
        text: 'Important note annotation',
        color: '#0f172a',
        fontSize: 14,
      },
      {
        id: 'ann_3',
        type: 'rectangle',
        pageNumber: 1,
        x: 35,
        y: 50,
        width: 200,
        height: 80,
        color: '#ef4444',
      },
      {
        id: 'ann_4',
        type: 'drawing',
        pageNumber: 1,
        x: 50,
        y: 150,
        width: 50,
        height: 50,
        color: '#0284c7',
        points: [
          { x: 50, y: 150 },
          { x: 75, y: 175 },
          { x: 100, y: 150 },
        ],
      },
    ]);

    expect(annotatedBytes).toBeInstanceOf(Uint8Array);
    expect(annotatedBytes.length).toBeGreaterThan(testPdf.length);

    const doc = await PDFDocument.load(annotatedBytes);
    expect(doc.getPageCount()).toBe(2);
  });
});
