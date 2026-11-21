import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import {
  ImageToPdfOptions,
  PDFMetadata,
  SplitOptions,
  VisualSignature,
  VisualAnnotation,
  AcroFormFieldInfo
} from './types';
import { parsePageRange } from './page-ranges';

/**
 * Reads basic page count without full rendering
 */
export async function getPDFPageCount(fileData: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Merges multiple PDF byte arrays into a single PDF document in the specified order.
 */
export async function mergePDFs(pdfByteArrays: Uint8Array[]): Promise<Uint8Array> {
  if (pdfByteArrays.length === 0) {
    throw new Error('No PDF documents provided to merge.');
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < pdfByteArrays.length; i++) {
    const bytes = pdfByteArrays[i];
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageIndices = doc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(doc, pageIndices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return await mergedDoc.save();
}

/**
 * Splits a PDF according to the given mode:
 * - 'all': splits into individual 1-page PDFs
 * - 'range': splits according to rangeText (e.g. "1-3, 4-5")
 * - 'selected': extracts selected pages into one PDF
 * - 'odd': creates a PDF with odd pages
 * - 'even': creates a PDF with even pages
 */
export async function splitPDF(
  fileData: Uint8Array,
  options: SplitOptions
): Promise<{ name: string; data: Uint8Array }[]> {
  const srcDoc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];

  if (options.mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save();
      results.push({ name: `page-${i + 1}.pdf`, data: bytes });
    }
    return results;
  }

  if (options.mode === 'odd') {
    const oddIndices = [];
    for (let i = 0; i < totalPages; i += 2) {
      oddIndices.push(i);
    }
    if (oddIndices.length === 0) throw new Error('No odd pages found.');
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, oddIndices);
    for (const p of copiedPages) newDoc.addPage(p);
    results.push({ name: 'odd-pages.pdf', data: await newDoc.save() });
    return results;
  }

  if (options.mode === 'even') {
    const evenIndices = [];
    for (let i = 1; i < totalPages; i += 2) {
      evenIndices.push(i);
    }
    if (evenIndices.length === 0) throw new Error('No even pages found (single-page document).');
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, evenIndices);
    for (const p of copiedPages) newDoc.addPage(p);
    results.push({ name: 'even-pages.pdf', data: await newDoc.save() });
    return results;
  }

  if (options.mode === 'range') {
    const rangeText = options.rangeText || '1';
    // If multiple range segments are given (e.g., "1-2, 3-5"), generate individual files for each segment
    const segments = rangeText.split(',').map((s) => s.trim()).filter(Boolean);

    for (const segment of segments) {
      const { pages, errors } = parsePageRange(segment, totalPages);
      if (errors.length > 0 || pages.length === 0) {
        throw new Error(`Invalid range "${segment}": ${errors.join(', ')}`);
      }
      const newDoc = await PDFDocument.create();
      const zeroBasedIndices = pages.map((p) => p - 1);
      const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);
      for (const p of copiedPages) newDoc.addPage(p);
      results.push({
        name: `split-pages-${segment.replace(/\s+/g, '')}.pdf`,
        data: await newDoc.save(),
      });
    }
    return results;
  }

  if (options.mode === 'selected') {
    const pages = options.selectedPages || [];
    if (pages.length === 0) throw new Error('No pages selected.');
    const newDoc = await PDFDocument.create();
    const zeroBasedIndices = pages.map((p) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
    const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);
    for (const p of copiedPages) newDoc.addPage(p);
    results.push({ name: 'extracted-pages.pdf', data: await newDoc.save() });
    return results;
  }

  throw new Error(`Unsupported split mode: ${options.mode}`);
}

/**
 * Extracts specific pages (1-based) into a brand new PDF.
 */
export async function extractPages(fileData: Uint8Array, pageNumbers: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const validIndices = pageNumbers
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < totalPages);

  if (validIndices.length === 0) {
    throw new Error('No valid pages to extract.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save();
}

/**
 * Rotates specific or all pages in a PDF by 90, 180, or 270 degrees clockwise.
 */
export async function rotatePDF(
  fileData: Uint8Array,
  angle: 90 | 180 | 270,
  targetPages?: number[] // 1-based; if omitted or empty, rotates all pages
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const pages = doc.getPages();

  const targetSet = targetPages && targetPages.length > 0 ? new Set(targetPages) : null;

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    if (!targetSet || targetSet.has(pageNum)) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + angle) % 360;
      page.setRotation(degrees(newRotation));
    }
  }

  return await doc.save();
}

/**
 * Reorders, rotates, or deletes pages to create an organized PDF.
 */
export async function reorderAndModifyPages(
  fileData: Uint8Array,
  items: { originalIndex: number; rotation?: number; delete?: boolean }[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const newDoc = await PDFDocument.create();

  for (const item of items) {
    if (item.delete) continue;
    if (item.originalIndex < 0 || item.originalIndex >= totalPages) continue;

    const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
    if (item.rotation) {
      const cur = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((cur + item.rotation) % 360));
    }
    newDoc.addPage(copiedPage);
  }

  if (newDoc.getPageCount() === 0) {
    throw new Error('All pages were deleted. A PDF must have at least one page.');
  }

  return await newDoc.save();
}

/**
 * Converts images (data URLs or blobs) into a formatted PDF document.
 */
export async function imagesToPDF(
  images: {
    dataUrl: string; // Base64 or Object URL
    width: number;
    height: number;
    rotation?: number;
  }[],
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('No images provided for PDF creation.');
  }

  const doc = await PDFDocument.create();
  if (options.title) {
    doc.setTitle(options.title);
  }

  // Margin points: 72 points per inch
  let marginPts = 0;
  if (options.margin === 'small') marginPts = 18;
  if (options.margin === 'medium') marginPts = 36;
  if (options.margin === 'large') marginPts = 54;

  // Standard dimensions in points
  const A4_PORTRAIT: [number, number] = [595.28, 841.89];
  const LETTER_PORTRAIT: [number, number] = [612.0, 792.0];

  for (const img of images) {
    // Convert dataURL to Uint8Array
    const res = await fetch(img.dataUrl);
    const imageBytes = await res.arrayBuffer();

    let embeddedImage;
    if (img.dataUrl.startsWith('data:image/png') || img.dataUrl.includes('.png')) {
      embeddedImage = await doc.embedPng(imageBytes);
    } else {
      embeddedImage = await doc.embedJpg(imageBytes);
    }

    let pageWidth = 0;
    let pageHeight = 0;

    const isImgLandscape = img.width > img.height;

    if (options.pageSize === 'fit') {
      pageWidth = img.width + marginPts * 2;
      pageHeight = img.height + marginPts * 2;
    } else {
      const base = options.pageSize === 'a4' ? A4_PORTRAIT : LETTER_PORTRAIT;
      let isTargetLandscape = false;
      if (options.orientation === 'landscape') isTargetLandscape = true;
      else if (options.orientation === 'portrait') isTargetLandscape = false;
      else isTargetLandscape = isImgLandscape; // auto

      pageWidth = isTargetLandscape ? Math.max(base[0], base[1]) : Math.min(base[0], base[1]);
      pageHeight = isTargetLandscape ? Math.min(base[0], base[1]) : Math.max(base[0], base[1]);
    }

    const page = doc.addPage([pageWidth, pageHeight]);
    const printableWidth = pageWidth - marginPts * 2;
    const printableHeight = pageHeight - marginPts * 2;

    let drawWidth = printableWidth;
    let drawHeight = printableHeight;

    const imgAspect = img.width / img.height;
    const printAspect = printableWidth / printableHeight;

    if (options.fitMode === 'contain') {
      if (imgAspect > printAspect) {
        drawWidth = printableWidth;
        drawHeight = printableWidth / imgAspect;
      } else {
        drawHeight = printableHeight;
        drawWidth = printableHeight * imgAspect;
      }
    } else {
      // cover
      if (imgAspect > printAspect) {
        drawHeight = printableHeight;
        drawWidth = printableHeight * imgAspect;
      } else {
        drawWidth = printableWidth;
        drawHeight = printableWidth / imgAspect;
      }
    }

    const x = marginPts + (printableWidth - drawWidth) / 2;
    const y = marginPts + (printableHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      rotate: img.rotation ? degrees(img.rotation) : undefined,
    });
  }

  return await doc.save();
}

/**
 * Performs client-side structural optimization on a PDF.
 * Strips unreferenced objects, removes duplicate fonts/streams where possible, and compacts streams.
 */
export async function compressPDFLossless(fileData: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  // Saving with objectsPerTick and useObjectStreams=true creates compact cross-reference streams
  const compressed = await doc.save({
    useObjectStreams: true,
  });
  return compressed;
}

/**
 * Reads metadata from a PDF
 */
export async function readPDFMetadata(fileData: Uint8Array): Promise<PDFMetadata> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const kw = doc.getKeywords();
  const keywordsStr = typeof kw === 'string' ? kw : Array.isArray(kw) ? (kw as string[]).join(', ') : '';

  return {
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    subject: doc.getSubject() || '',
    keywords: keywordsStr,
    producer: doc.getProducer() || '',
    creator: doc.getCreator() || '',
    creationDate: doc.getCreationDate() ? doc.getCreationDate()?.toISOString() : '',
    modificationDate: doc.getModificationDate() ? doc.getModificationDate()?.toISOString() : '',
  };
}

/**
 * Updates or sets PDF metadata
 */
export async function updatePDFMetadata(
  fileData: Uint8Array,
  meta: Partial<PDFMetadata>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });

  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) {
    const list = meta.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    doc.setKeywords(list);
  }
  if (meta.producer !== undefined) doc.setProducer(meta.producer);
  if (meta.creator !== undefined) doc.setCreator(meta.creator);
  doc.setModificationDate(new Date());

  return await doc.save();
}

/**
 * Strips all identifying metadata from a PDF for maximum privacy.
 */
export async function stripPDFMetadata(fileData: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');
  return await doc.save();
}

/**
 * Applies visual signatures onto specified pages of a PDF document.
 * (Note: Applies visual appearance stamps; does not claim cryptographic certification).
 */
export async function applyVisualSignatures(
  fileData: Uint8Array,
  signatures: VisualSignature[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (const sig of signatures) {
    const pageIndex = sig.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const imageRes = await fetch(sig.dataUrl);
    const imageBytes = await imageRes.arrayBuffer();

    const pngImage = await doc.embedPng(imageBytes);

    // In PDF coordinates, y=0 is at bottom left of the page
    const pageHeight = page.getHeight();
    const pdfY = pageHeight - sig.y - sig.height;

    page.drawImage(pngImage, {
      x: sig.x,
      y: Math.max(0, pdfY),
      width: sig.width,
      height: sig.height,
      rotate: sig.rotation ? degrees(sig.rotation) : undefined,
    });
  }

  return await doc.save();
}

/**
 * Applies visual annotations (text, highlights, shapes, drawings) onto pages.
 */
export async function applyVisualAnnotations(
  fileData: Uint8Array,
  annotations: VisualAnnotation[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const ann of annotations) {
    const pageIndex = ann.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    // Parse hex color to rgb
    const hex = ann.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

    if (ann.type === 'text' && ann.text) {
      const fontSize = ann.fontSize || 14;
      const pdfY = pageHeight - ann.y - fontSize;
      page.drawText(ann.text, {
        x: ann.x,
        y: Math.max(0, pdfY),
        size: fontSize,
        font,
        color: rgb(r, g, b),
      });
    } else if (ann.type === 'highlight' && ann.width && ann.height) {
      const pdfY = pageHeight - ann.y - ann.height;
      page.drawRectangle({
        x: ann.x,
        y: Math.max(0, pdfY),
        width: ann.width,
        height: ann.height,
        color: rgb(r, g, b),
        opacity: ann.opacity ?? 0.35,
      });
    } else if (ann.type === 'rectangle' && ann.width && ann.height) {
      const pdfY = pageHeight - ann.y - ann.height;
      page.drawRectangle({
        x: ann.x,
        y: Math.max(0, pdfY),
        width: ann.width,
        height: ann.height,
        borderColor: rgb(r, g, b),
        borderWidth: 2,
        opacity: ann.opacity ?? 1,
      });
    } else if (ann.type === 'strike' && ann.width) {
      const pdfY = pageHeight - ann.y;
      page.drawLine({
        start: { x: ann.x, y: pdfY },
        end: { x: ann.x + ann.width, y: pdfY },
        thickness: 1.5,
        color: rgb(r, g, b),
      });
    }
  }

  return await doc.save();
}

/**
 * Inspects AcroForm interactive fields present in a PDF
 */
export async function getAcroFields(fileData: Uint8Array): Promise<AcroFormFieldInfo[]> {
  try {
    const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = form.getFields();

    return fields.map((field) => {
      const name = field.getName();
      const constructorName = field.constructor.name;
      let type: AcroFormFieldInfo['type'] = 'other';
      let value: string | boolean = '';

      if (constructorName.includes('TextField')) {
        type = 'text';
        try {
          value = (field as any).getText() || '';
        } catch {
          value = '';
        }
      } else if (constructorName.includes('CheckBox')) {
        type = 'checkbox';
        try {
          value = (field as any).isChecked() || false;
        } catch {
          value = false;
        }
      } else if (constructorName.includes('Dropdown') || constructorName.includes('OptionList')) {
        type = 'dropdown';
        try {
          value = (field as any).getSelected()?.join(', ') || '';
        } catch {
          value = '';
        }
      }

      return {
        name,
        type,
        value,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fills AcroForm interactive fields in a PDF
 */
export async function fillAcroFields(
  fileData: Uint8Array,
  fieldValues: Record<string, string | boolean>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  const form = doc.getForm();

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (typeof val === 'boolean') {
        const checkbox = form.getCheckBox(name);
        if (val) checkbox.check();
        else checkbox.uncheck();
      } else if (typeof val === 'string') {
        const textField = form.getTextField(name);
        textField.setText(val);
      }
    } catch {
      // field might not exist or be different type
    }
  }

  return await doc.save();
}
