export interface ToolMeta {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  category: 'convert' | 'organize' | 'edit' | 'optimize' | 'security';
  icon: string;
  badge?: string;
  aliases?: string[];
  acceptedMimeTypes: string;
  acceptLabel: string;
  multiple: boolean;
  howItWorks: { step: number; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  limitations: string[];
  tips: string[];
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  producer: string;
  creator: string;
  creationDate?: string;
  modificationDate?: string;
}

export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type MarginOption = 'none' | 'small' | 'medium' | 'large';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientation;
  margin: MarginOption;
  fitMode: 'contain' | 'cover';
  quality: number; // 0.1 to 1.0
  title?: string;
}

export interface SplitOptions {
  mode: 'all' | 'range' | 'selected' | 'odd' | 'even';
  rangeText?: string;
  selectedPages?: number[];
}

export interface CompressionOptions {
  mode: 'lossless' | 'balanced' | 'raster';
  imageQuality: number; // 0.3 - 0.9
  scale: number; // 1.0 - 2.0
}

export interface CompressionResult {
  originalBytes: number;
  newBytes: number;
  savingsPercent: number;
  pdfData: Uint8Array;
  modeUsed: string;
  warning?: string;
}

export interface VisualSignature {
  id: string;
  type: 'draw' | 'type' | 'image';
  dataUrl: string; // PNG base64
  x: number; // points
  y: number; // points
  width: number;
  height: number;
  rotation: number;
  pageNumber: number; // 1-based
}

export interface VisualAnnotation {
  id: string;
  type: 'text' | 'highlight' | 'rectangle' | 'drawing' | 'strike';
  pageNumber: number; // 1-based
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  fontSize?: number;
  opacity?: number;
  points?: { x: number; y: number }[];
}

export interface AcroFormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'signature' | 'other';
  value: string | boolean;
  pageNumber?: number;
}

export type PdfEditItemType =
  | 'text'
  | 'whiteout' // replaces/covers text with matching background color and optional text on top
  | 'redaction' // legal permanent blackout block with optional [REDACTED] label
  | 'watermark' // diagonal document watermark
  | 'image'
  | 'stamp'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'highlight'
  | 'freehand';

export type StandardFontFamily = 'Helvetica' | 'Times-Roman' | 'Courier';

export interface DetectedPdfTextItem {
  id: string;
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: StandardFontFamily;
  pageNumber: number;
}


export interface PdfEditItem {
  id: string;
  type: PdfEditItemType;
  pageNumber: number; // 1-based
  x: number; // points from left
  y: number; // points from top
  width: number;
  height: number;
  // Text styling
  text?: string;
  fontFamily?: StandardFontFamily;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  opacity?: number;
  // Shapes & borders
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  // Images & Stamps
  dataUrl?: string; // base64 PNG/JPG
  stampLabel?: string;
  // Freehand drawing points
  points?: { x: number; y: number }[];
  rotation?: number;
}

