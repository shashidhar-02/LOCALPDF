import { ToolMeta } from './types';

export const TOOLS: ToolMeta[] = [
  {
    id: 'edit-pdf',
    slug: 'edit-pdf',
    title: 'Edit PDF Online — Free & 100% Private Browser Editor',
    shortTitle: 'Edit PDF',
    tagline: 'Add new text, erase or replace existing text with matched fonts, insert images, shapes, and stamps.',
    description: 'Full-featured browser-based PDF editor. Type text with custom fonts (Helvetica, Times Roman, Courier), whiteout existing text to replace it seamlessly, draw shapes, and add enterprise stamps without uploading your files.',
    category: 'edit',
    icon: 'PenToolIcon',
    badge: 'New & Popular',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Choose a PDF to edit',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Upload Document', desc: 'Drag and drop your PDF. The file is loaded securely into local browser memory with zero network uploads.' },
      { step: 2, title: 'Make Your Edits', desc: 'Add new text boxes, use the Whiteout tool to erase/replace original text with matching fonts, or insert shapes and stamps.' },
      { step: 3, title: 'Export & Download', desc: 'Click "Download PDF". LocalPDF embeds all vector shapes, fonts, and text directly using client-side WebAssembly.' }
    ],
    faqs: [
      { q: 'Can I replace or erase existing text in my PDF?', a: 'Yes! Use the "Erase / Replace" tool to draw a whiteout box over any existing word or paragraph, and type your new replacement text directly over it with matching font and size.' },
      { q: 'Which fonts are supported?', a: 'Standard high-fidelity PDF fonts are supported including Helvetica (Arial equivalent), Times Roman (Serif), and Courier (Monospace), with full Bold and Italic formatting.' },
      { q: 'Is my document private?', a: '100% private. LocalPDF never uploads your files to any remote server or AI API. All editing and rendering happen in your browser.' }
    ],
    limitations: [
      'Encrypted or password-locked PDFs must be unlocked before editing.',
      'Extremely complex layered vector CAD blueprints may take a few seconds to render on low-power devices.'
    ],
    tips: [
      'Use Ctrl+Z / Cmd+Z to undo and Ctrl+Y to redo any changes instantly.',
      'Click on any placed item to adjust font size, color, or press Delete to remove it.'
    ]
  },
  {
    id: 'redact-pdf',
    slug: 'redact-pdf',
    title: 'Redact PDF Online — Permanently Blackout Sensitive Data',
    shortTitle: 'Redact PDF',
    tagline: 'Permanently blackout private information, SSNs, financial figures, and addresses.',
    description: 'Enterprise-grade legal PDF redaction tool. Draw blackout boxes directly over sensitive text with optional custom labels ([REDACTED], CONFIDENTIAL, FOIA EXEMPT). Runs 100% in your browser.',
    category: 'security',
    icon: 'ShieldAlertIcon',
    badge: 'Security',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Choose a PDF to redact',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Select Document', desc: 'Drop your PDF into the local memory viewer.' },
      { step: 2, title: 'Mark Redactions', desc: 'Click and drag black boxes over any sensitive words or numbers.' },
      { step: 3, title: 'Sanitize & Download', desc: 'Click Download. Blackout blocks are burned permanently into the PDF vector stream.' }
    ],
    faqs: [
      { q: 'Can redacted text be selected or copied?', a: 'No. The underlying area is permanently overwritten with solid black vector geometry.' },
      { q: 'Are documents sent to a cloud server?', a: 'Never. All redaction occurs strictly in client WebAssembly memory.' }
    ],
    limitations: [
      'Scanned bitmap pages cannot be automatically OCR-redacted; you must manually drag the box over the text area.'
    ],
    tips: [
      'Use the "Solid" button if you do not want the [REDACTED] label displayed.'
    ]
  },
  {
    id: 'watermark-pdf',
    slug: 'watermark-pdf',
    title: 'Watermark PDF Online — Add Confidential, Draft & Custom Watermarks',
    shortTitle: 'Watermark PDF',
    tagline: 'Stamp diagonal or horizontal text watermarks across all document pages.',
    description: 'Add customized semi-transparent watermarks (CONFIDENTIAL, DRAFT, DO NOT COPY, SAMPLE) across every page with custom opacity and text styling. 100% private in your browser.',
    category: 'edit',
    icon: 'DropletIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Choose a PDF to watermark',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Upload PDF', desc: 'Choose a PDF document to watermark.' },
      { step: 2, title: 'Customize Text & Opacity', desc: 'Type your custom watermark text or pick a preset like CONFIDENTIAL or DRAFT.' },
      { step: 3, title: 'Download', desc: 'Download your watermarked PDF instantly.' }
    ],
    faqs: [
      { q: 'Will watermarking affect existing text?', a: 'No, watermarks are applied as a translucent vector overlay at 45 degrees.' }
    ],
    limitations: ['Extremely dense vector drawings might partially overlap the watermark text.'],
    tips: ['Keep opacity around 20% for optimal readability of underlying text.']
  },
  {
    id: 'page-number-pdf',
    slug: 'page-number-pdf',
    title: 'Add Page Numbers to PDF — Free Bates Numbering',
    shortTitle: 'Page Numbers',
    tagline: 'Stamp clean page numbers and Bates labels onto all PDF pages automatically.',
    description: 'Add page numbers (Page 1 of N, Bates-1, etc.) to your documents. Choose position (bottom center, bottom right, top right) and custom prefix. 100% device-only.',
    category: 'edit',
    icon: 'HashIcon',
    aliases: ['add-page-numbers'],
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Choose a PDF to add page numbers',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Upload PDF', desc: 'Select any PDF document from your device.' },
      { step: 2, title: 'Pick Style & Position', desc: 'Select formatting (Page 1 of N) and positioning (Bottom Center, Bottom Right, Top Right).' },
      { step: 3, title: 'Download', desc: 'Download your numbered PDF immediately.' }
    ],
    faqs: [
      { q: 'Can I customize the numbering prefix?', a: 'Yes, you can enter any custom prefix like "Page ", "Doc-", or "Bates-".' }
    ],
    limitations: ['Pages with zero margins might display numbers close to content.'],
    tips: ['Bottom Center is the standard convention for formal and academic documents.']
  },
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    title: 'JPG & Images to PDF Converter',
    shortTitle: 'JPG to PDF',
    tagline: 'Convert JPG, PNG, and WebP images into a single clean PDF document in seconds.',
    description: 'Combine multiple photos, screenshots, and scans into a single PDF. Customize page orientation, paper size (A4, Letter, Fit), margins, and reorder images effortlessly.',
    category: 'convert',
    icon: 'ImageIcon',
    aliases: ['image-to-pdf', 'photos-to-pdf'],
    acceptedMimeTypes: 'image/jpeg,image/png,image/webp',
    acceptLabel: 'Choose JPG, PNG, or WebP images',
    multiple: true,
    howItWorks: [
      { step: 1, title: 'Select Images', desc: 'Drop one or multiple photos (JPG, PNG, WebP) from your computer or phone.' },
      { step: 2, title: 'Customize Layout', desc: 'Rearrange image order, pick paper size (A4, Letter, or Fit), margins, and orientation.' },
      { step: 3, title: 'Generate & Download', desc: 'Click "Convert to PDF". LocalPDF builds the document instantly right inside your browser.' }
    ],
    faqs: [
      { q: 'Are my pictures uploaded to any server?', a: 'No. LocalPDF uses client-side Web APIs and pdf-lib. Your photos never leave your device memory.' },
      { q: 'Can I combine multiple different image formats?', a: 'Yes, you can mix JPG, PNG, and WebP files in any combination and reorder them.' },
      { q: 'What is the maximum number of images?', a: 'Since processing is client-side, it is bounded only by your device RAM. Usually 100+ images convert smoothly.' }
    ],
    limitations: [
      'Extremely large raw DSLR camera files (e.g. 50MB each) may consume significant browser memory on low-spec phones.',
      'Animated GIFs or SVG vector files should be converted to standard PNG/JPG before conversion.'
    ],
    tips: [
      'Use the "Fit to Image" page size if you want each page to match the exact dimensions of your original photo.',
      'Drag and drop image cards to adjust their order in the resulting PDF.'
    ]
  },
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    title: 'Merge PDF Files Online',
    shortTitle: 'Merge PDF',
    tagline: 'Combine multiple PDF files into a single unified document in any order.',
    description: 'Fast, secure client-side PDF merger. Drag to reorder your documents, preview individual pages, and download your consolidated PDF without upload limits or watermarks.',
    category: 'organize',
    icon: 'CombineIcon',
    badge: 'Popular',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select 2 or more PDF files',
    multiple: true,
    howItWorks: [
      { step: 1, title: 'Add PDF Files', desc: 'Drop two or more PDF files into the upload box.' },
      { step: 2, title: 'Arrange Order', desc: 'Drag items up or down to set the exact sequence you want them to appear.' },
      { step: 3, title: 'Merge Document', desc: 'Click "Merge PDFs" to combine all pages into one document instantly.' }
    ],
    faqs: [
      { q: 'Does merging preserve form fields and links?', a: 'Yes, standard links and page content are preserved in the merged output.' },
      { q: 'Is there a file size limit?', a: 'There are no artificial file size limits. You can merge PDFs as large as your device memory allows.' },
      { q: 'Can I merge on iPhone or Android?', a: 'Yes! LocalPDF is fully mobile-responsive and works inside Safari, Chrome, and Edge on iOS and Android.' }
    ],
    limitations: [
      'Password-encrypted PDFs must be unlocked before merging.',
      'Exotic dynamic XFA forms created in Adobe LiveCycle may be flattened.'
    ],
    tips: [
      'Use the drag handles or arrow buttons to easily reorder files before merging.',
      'Remove accidental uploads using the delete icon before hitting merge.'
    ]
  },
  {
    id: 'split-pdf',
    slug: 'split-pdf',
    title: 'Split PDF Pages & Ranges',
    shortTitle: 'Split PDF',
    tagline: 'Split a PDF into separate files, extract page ranges, or separate odd and even pages.',
    description: 'Flexible PDF splitting in your browser. Extract every page as an individual file, split by custom range (e.g., 1-5, 6-10), or extract odd and even pages for double-sided scanning.',
    category: 'organize',
    icon: 'ScissorsIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select a PDF to split',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Choose Split Mode', desc: 'Select whether you want every page, custom ranges (e.g. 1-3, 4-10), odd, or even pages.' },
      { step: 2, title: 'Preview Pages', desc: 'Review page count and verify your range selection.' },
      { step: 3, title: 'Download Parts', desc: 'LocalPDF extracts the specified pages and downloads your separate PDF files immediately.' }
    ],
    faqs: [
      { q: 'How do page ranges work?', a: 'Enter comma-separated ranges such as "1-3, 4-8, 10". LocalPDF will create an individual PDF for each segment.' },
      { q: 'Will the original file be modified?', a: 'No, the original PDF remains untouched on your drive; a new split file is downloaded.' }
    ],
    limitations: [
      'When splitting into 50+ individual pages, browser download popups may ask for permission to download multiple files.'
    ],
    tips: [
      'Use the "Odd Pages" and "Even Pages" split mode if you scanned a two-sided stack of papers manually.'
    ]
  },
  {
    id: 'extract-pdf-pages',
    slug: 'extract-pdf-pages',
    title: 'Extract PDF Pages',
    shortTitle: 'Extract Pages',
    tagline: 'Select and extract specific pages from any PDF into a new, smaller document.',
    description: 'Pull out exactly the pages you need (e.g. pages 1, 4, 7-10). Click thumbnails or enter page numbers to isolate key pages without quality loss.',
    category: 'organize',
    icon: 'LayersIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select a PDF to extract from',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Upload PDF', desc: 'Drop your PDF document into the browser.' },
      { step: 2, title: 'Select Pages', desc: 'Click page thumbnails or type ranges like "1, 3, 5-8, 10-12".' },
      { step: 3, title: 'Extract', desc: 'Click "Extract Pages" to create a fresh PDF with only your selected pages.' }
    ],
    faqs: [
      { q: 'Can I extract non-consecutive pages?', a: 'Yes! You can enter any combination, e.g. "1, 5, 9, 12-15".' },
      { q: 'Does extraction re-compress images?', a: 'No, page streams are transferred losslessly without re-encoding existing raster images.' }
    ],
    limitations: [
      'Cannot extract pages from a password-protected PDF without entering the password first.'
    ],
    tips: [
      'Click directly on page thumbnails in the visual grid to toggle page selection quickly.'
    ]
  },
  {
    id: 'rotate-pdf',
    slug: 'rotate-pdf',
    title: 'Rotate PDF Pages (90°, 180°, 270°)',
    shortTitle: 'Rotate PDF',
    tagline: 'Permanently rotate upside-down or sideways pages in your PDF.',
    description: 'Fix scanning orientation errors instantly. Rotate all pages at once or target individual pages by 90°, 180°, or 270° clockwise. Saves permanently without re-uploading.',
    category: 'organize',
    icon: 'RotateCwIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select a PDF to rotate',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Open PDF', desc: 'Drop your document into LocalPDF.' },
      { step: 2, title: 'Select Rotation Angle', desc: 'Choose 90°, 180°, or 270° and specify all pages or selected pages.' },
      { step: 3, title: 'Save & Download', desc: 'Download your permanently rotated PDF.' }
    ],
    faqs: [
      { q: 'Is the rotation permanent?', a: 'Yes. The rotation flag is written into the PDF specification so it opens correctly in every PDF viewer.' }
    ],
    limitations: [
      'Applies 90-degree orthogonal increments as specified by standard PDF orientation tags.'
    ],
    tips: [
      'Use 180° rotation if pages were scanned upside-down.'
    ]
  },
  {
    id: 'pdf-page-organizer',
    slug: 'pdf-page-organizer',
    title: 'PDF Page Organizer & Reorder',
    shortTitle: 'Organize Pages',
    tagline: 'Visual page grid to reorder, duplicate, rotate, and delete PDF pages.',
    description: 'Interactive visual page organizer. View thumbnails of every page, drag to reorder them, delete unwanted sheets, or rotate individual pages with one click.',
    category: 'organize',
    icon: 'GridIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF to organize',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'View Thumbnails', desc: 'Drop your PDF to see a visual thumbnail of every page rendered locally.' },
      { step: 2, title: 'Rearrange & Clean', desc: 'Drag pages into your desired order, rotate misplaced pages, and delete extras.' },
      { step: 3, title: 'Export', desc: 'Click "Save Organized PDF" to produce the cleaned document.' }
    ],
    faqs: [
      { q: 'Are page thumbnails sent to a server?', a: 'No, thumbnails are rendered in your browser using HTML5 Canvas and PDF.js.' }
    ],
    limitations: [
      'At least one page must remain in the document.'
    ],
    tips: [
      'You can rotate individual landscape and portrait pages independently before saving.'
    ]
  },
  {
    id: 'compress-pdf',
    slug: 'compress-pdf',
    title: 'Compress PDF Online (Honest Client-Side)',
    shortTitle: 'Compress PDF',
    tagline: 'Reduce PDF file size directly in your browser without uploading to a third-party server.',
    description: 'Transparent client-side PDF compressor. Choose between lossless structural stream compaction or balanced image downsampling. See exact before and after file sizes and savings percentage.',
    category: 'optimize',
    icon: 'Minimize2Icon',
    badge: 'Honest UX',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF to compress',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Drop PDF', desc: 'Select any PDF file from your device.' },
      { step: 2, title: 'Choose Mode', desc: 'Pick "Lossless Structure Optimization" (maintains text fidelity) or "Rasterized Optimization" (for scanned/photo PDFs).' },
      { step: 3, title: 'Check Savings', desc: 'Inspect the verified size comparison before downloading.' }
    ],
    faqs: [
      { q: 'Why do some PDFs not compress much?', a: 'PDFs that only contain vectors, fonts, or are already compressed with FlateDecode cannot be compressed further without rasterization.' },
      { q: 'Does LocalPDF lie about file size savings?', a: 'Never. If a compressed file turns out larger, LocalPDF explicitly tells you and preserves the smaller original.' }
    ],
    limitations: [
      'Rasterized compression turns pages into image layers; selectable text may no longer be copyable in that mode.'
    ],
    tips: [
      'For invoices and contracts with text, try Lossless mode first to maintain crisp vector fonts.'
    ]
  },
  {
    id: 'sign-pdf',
    slug: 'sign-pdf',
    title: 'Sign PDF Online (Draw, Type, Upload)',
    shortTitle: 'Sign PDF',
    tagline: 'Add a clean visual signature to any PDF document in seconds.',
    description: 'Draw your signature with mouse or finger, type your name in cursive styles, or upload an image stamp. Position, resize, and place it anywhere on your document.',
    category: 'edit',
    icon: 'PenToolIcon',
    badge: 'Private',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF to sign',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Create Signature', desc: 'Draw your signature on the canvas pad, type your name, or upload a signature image.' },
      { step: 2, title: 'Place on Document', desc: 'Navigate to the target page, drag the signature stamp into position, and resize.' },
      { step: 3, title: 'Download Signed Copy', desc: 'Click "Apply & Download" to burn the signature into the PDF.' }
    ],
    faqs: [
      { q: 'Does this create a cryptographic digital certificate?', a: 'No. LocalPDF applies a visual signature stamp onto the document. It does not provide PKI/X.509 digital certificate signing.' },
      { q: 'Can I sign on my smartphone?', a: 'Yes! The signature pad supports touch gestures on iOS and Android devices.' }
    ],
    limitations: [
      'Visual signature only. If a court or government specifically mandates cryptographic AATL certificate signing, use an authorized hardware token or Adobe Acrobat.'
    ],
    tips: [
      'You can adjust the signature scale and position right on the live page preview before downloading.'
    ]
  },
  {
    id: 'annotate-pdf',
    slug: 'annotate-pdf',
    title: 'Annotate PDF (Text, Highlights, Shapes)',
    shortTitle: 'Annotate PDF',
    tagline: 'Add text notes, highlight key passages, draw shapes, and strike through text.',
    description: 'Fast, lightweight browser PDF annotator. Add text notes, colorful highlights, rectangle boxes, and strikethroughs directly onto PDF pages without installing desktop software.',
    category: 'edit',
    icon: 'HighlighterIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF to annotate',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Select Tool', desc: 'Pick Text, Highlight, Box, or Strikethrough from the toolbar.' },
      { step: 2, title: 'Annotate', desc: 'Click on any page to place text notes or drag boxes over important sections.' },
      { step: 3, title: 'Save', desc: 'Download your annotated PDF with all marks embedded.' }
    ],
    faqs: [
      { q: 'Are annotations permanent?', a: 'Yes, LocalPDF renders the annotations directly into the PDF content stream upon export.' }
    ],
    limitations: [
      'Complex SVG vector paths and free-form pen strokes are simplified to maintain high rendering speed.'
    ],
    tips: [
      'Use yellow or cyan highlight boxes to emphasize important clauses in legal agreements.'
    ]
  },
  {
    id: 'fill-pdf',
    slug: 'fill-pdf',
    title: 'Fill PDF Forms & Text',
    shortTitle: 'Fill PDF',
    tagline: 'Fill out interactive PDF forms or add custom text fields onto non-interactive forms.',
    description: 'Fill standard PDF form fields or overlay clean text boxes on flat scanned applications. Type information, check boxes, and download completed forms.',
    category: 'edit',
    icon: 'CheckSquareIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF form to fill',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Detect Fields', desc: 'LocalPDF checks if the document has standard AcroForm fields.' },
      { step: 2, title: 'Fill & Review', desc: 'Type your responses into detected fields or click anywhere to add a text overlay.' },
      { step: 3, title: 'Download', desc: 'Save your filled form locally.' }
    ],
    faqs: [
      { q: 'Does it support standard AcroForms?', a: 'Yes, text fields and checkboxes in standard PDF forms are editable.' }
    ],
    limitations: [
      'Adobe LiveCycle dynamic XML XFA forms are proprietary and not fully supported by standard browser libraries.'
    ],
    tips: [
      'If a form has no interactive fields (a flat scan), use the "Add Text Overlay" mode to type anywhere.'
    ]
  },
  {
    id: 'pdf-metadata',
    slug: 'pdf-metadata',
    title: 'View & Edit PDF Metadata',
    shortTitle: 'PDF Metadata',
    tagline: 'Inspect and edit title, author, subject, keywords, and strip hidden tracking tags.',
    description: 'Protect your privacy before sharing files. View existing metadata, edit author and title information, or click "Strip All Metadata" to wipe identifying traces from the file.',
    category: 'security',
    icon: 'FileTextIcon',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF to inspect metadata',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Read Metadata', desc: 'Drop your PDF to see existing Title, Author, Subject, Creator, and Producer tags.' },
      { step: 2, title: 'Edit or Clean', desc: 'Modify fields or hit "Strip All Metadata" for anonymity.' },
      { step: 3, title: 'Download Clean PDF', desc: 'Save the updated document.' }
    ],
    faqs: [
      { q: 'Why strip metadata?', a: 'Many PDF creators save your computer username, operating system, and creation date inside the file.' }
    ],
    limitations: [
      'Proprietary custom third-party XMP schemas may be preserved or simplified.'
    ],
    tips: [
      'Use "Strip All Metadata" before publishing resumes, research papers, or sensitive submissions.'
    ]
  },
  {
    id: 'pdf-to-text',
    slug: 'pdf-to-text',
    title: 'PDF to Text & Editable DOCX',
    shortTitle: 'PDF to Text / DOCX',
    tagline: 'Extract clean selectable text and generate editable Word documents (.docx).',
    description: 'Best-effort client-side text extractor. Extract text from every page of your PDF, copy to clipboard, save as .txt, or export an editable Microsoft Word (.docx) document.',
    category: 'convert',
    icon: 'FileCodeIcon',
    badge: 'Best-Effort',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Select PDF for text export',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Extract Text Stream', desc: 'LocalPDF parses the internal text layer of each page using PDF.js.' },
      { step: 2, title: 'Review Text', desc: 'Read extracted text on-screen, search, or edit.' },
      { step: 3, title: 'Export', desc: 'Copy to clipboard, download as Plain Text (.txt), or download as Editable Word (.docx).' }
    ],
    faqs: [
      { q: 'Is layout perfectly preserved in DOCX?', a: 'No. LocalPDF performs best-effort text extraction. Complex multi-column newspaper layouts and embedded graphics will not recreate identical desktop publishing layouts.' },
      { q: 'What if my PDF is a scanned image with no selectable text?', a: 'If your PDF is a scan, use our local "PDF OCR" tool instead.' }
    ],
    limitations: [
      'Text extraction requires an existing text layer. Scanned documents require OCR.',
      'Complex tabular layouts and columns may wrap text linearly.'
    ],
    tips: [
      'Check page 1 preview to verify that the PDF has selectable text.'
    ]
  },
  {
    id: 'pdf-ocr',
    slug: 'pdf-ocr',
    title: 'Client-Side PDF OCR (English, Hindi, Telugu)',
    shortTitle: 'PDF OCR',
    tagline: 'Recognize text from scanned PDFs and photos locally using WebAssembly.',
    description: 'Pure browser-based optical character recognition powered by Tesseract.js. Converts scanned pages and images into searchable, copyable text without uploading files to cloud OCR APIs.',
    category: 'convert',
    icon: 'ScanTextIcon',
    badge: 'Local AI / WASM',
    acceptedMimeTypes: 'application/pdf,image/jpeg,image/png',
    acceptLabel: 'Select scanned PDF or Image for OCR',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Select Language', desc: 'Choose English, Hindi (हिन्दी), or Telugu (తెలుగు).' },
      { step: 2, title: 'Local OCR Processing', desc: 'Tesseract WebAssembly engine initializes in a browser worker. Shows live page progress.' },
      { step: 3, title: 'Copy or Download', desc: 'Copy recognized text or download as text file.' }
    ],
    faqs: [
      { q: 'Where is the OCR model processed?', a: 'Inside your browser via WebAssembly (WASM). Your document is never transmitted to an external server.' },
      { q: 'Do language packs take a long time to download?', a: 'Initial language pack download happens once from unpkg CDN and is cached in browser storage for instant future use.' }
    ],
    limitations: [
      'Handwritten notes or heavily degraded faxes may produce lower recognition confidence than high-resolution printed text.',
      'High page count documents take longer on mobile processors.'
    ],
    tips: [
      'For best accuracy, ensure scans are straight and have good contrast.'
    ]
  },
  {
    id: 'protect-pdf',
    slug: 'protect-pdf',
    title: 'PDF Security & Protection Architecture',
    shortTitle: 'PDF Protection',
    tagline: 'Understand client-side PDF encryption standards and roadmap.',
    description: 'Transparent assessment of browser-side PDF protection. Learn how standard AES-256 PDF encryption works, why fake client-side password tools are dangerous, and our planned roadmap.',
    category: 'security',
    icon: 'ShieldIcon',
    badge: 'Roadmap & Transparency',
    acceptedMimeTypes: 'application/pdf',
    acceptLabel: 'Inspect PDF Security State',
    multiple: false,
    howItWorks: [
      { step: 1, title: 'Security Inspection', desc: 'Inspect whether an uploaded PDF has encryption flags or permissions.' },
      { step: 2, title: 'Honest Cryptography', desc: 'Understand why LocalPDF refuses to implement fake or insecure pseudo-passwords.' },
      { step: 3, title: 'Recommended Solutions', desc: 'Access verified command-line and local tools for certified AES-256 protection.' }
    ],
    faqs: [
      { q: 'Why is standard PDF encryption rarely implemented purely in client JavaScript?', a: 'Standard PDF AES-256 encryption requires complex Adobe security handlers, RC4/AES key derivation dictionaries, and cross-reference table encryption. Many online tools fake this or send your file to their server.' },
      { q: 'Does LocalPDF implement fake password protection?', a: 'Never. We only ship cryptographically sound implementations.' }
    ],
    limitations: [
      'Full AES-256 standard encryption handler is currently on our WASM roadmap.'
    ],
    tips: [
      'To protect sensitive data right now without cloud upload, use the "Strip PDF Metadata" tool to remove identifying author and device tags.'
    ]
  }
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug || t.aliases?.includes(slug));
}
