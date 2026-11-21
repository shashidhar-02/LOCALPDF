# LocalPDF-https://localpdf-ecru.vercel.app/

> **“Your PDF stays on your device.”**  
> Free, private, instant browser-only PDF tools. No accounts, no subscriptions, no file uploads, and zero watermarks.

LocalPDF is an open-source web application designed for fast, single-task PDF workflows that execute entirely on client hardware via WebAssembly, HTML5 Canvas, and modern Web APIs.

---

## Architecture Overview

```
                      +-------------------+
                      |    User Device    |
                      +-------------------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
      +-----------------+               +-----------------+
      | Web Application |               | Document Stream |
      |  (Vercel Host)  |               |  (Local Memory) |
      +-----------------+               +-----------------+
               |                                 |
               | Static Shell Assets             | ArrayBuffer (RAM)
               v                                 v
      +---------------------------------------------------+
      |                 Browser Sandbox                   |
      |                                                   |
      |  • pdf-lib: Stream composition, merge, & split    |
      |  • PDF.js: Render pipeline & text extraction      |
      |  • Tesseract: WebAssembly local OCR engine        |
      |  • docx: Client-side document packaging           |
      +---------------------------------------------------+
                                |
                                v
                      +-------------------+
                      |   Local Output    |
                      | (Blob / Download) |
                      +-------------------+
```

### Zero-Upload Guarantee
- **Document Payload:** 0 bytes transmitted over network.
- **Backend Processing:** None.
- **Analytics on Files:** None.
- **Account Requirement:** None.

---

## Supported Tools

| Tool | Route | Description |
| :--- | :--- | :--- |
| **Merge PDF** | `/merge-pdf` | Combine multiple documents in custom order. |
| **Split PDF** | `/split-pdf` | Split by range, every page, or odd/even sets. |
| **Extract Pages** | `/extract-pdf-pages` | Isolate specific pages (e.g. `1, 3, 5-8`). |
| **Rotate PDF** | `/rotate-pdf` | Permanently rotate pages 90°, 180°, or 270°. |
| **Organize Pages** | `/pdf-page-organizer` | Visual thumbnail grid to reorder and delete. |
| **Compress PDF** | `/compress-pdf` | Lossless structure compaction & raster mode. |
| **Sign PDF** | `/sign-pdf` | Draw, type, or stamp visual signature. |
| **Annotate PDF** | `/annotate-pdf` | Add notes, highlights, and geometric shapes. |
| **Fill Forms** | `/fill-pdf` | Interactive AcroForm fields & text overlay. |
| **PDF Metadata** | `/pdf-metadata` | Edit title/author or strip all metadata. |
| **PDF to Text/DOCX**| `/pdf-to-text` | Best-effort text extraction & Word export. |
| **Local OCR** | `/pdf-ocr` | Tesseract WASM OCR (English, Hindi, Telugu).|
| **Security Status** | `/protect-pdf` | Technical assessment of encryption standards. |

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/shashidharmushike/localpdf.git
cd localpdf

# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm run test

# Run build verification
npm run build
```

---

## Continuous Integration & Testing

The repository includes automated CI workflows via GitHub Actions (`.github/workflows/ci.yml`):
- **Vulnerability Audit:** `npm audit`
- **Type Checking:** `npx tsc --noEmit`
- **Unit Testing:** Vitest test suite (`tests/unit/*.test.ts`)
- **End-to-End Suite:** Playwright tests verifying local privacy and user journeys

---

## Deployment to Vercel

LocalPDF requires zero server environment variables or external database connections.

Deploy directly using the Vercel CLI:
```bash
npx vercel deploy --prod
```

---

## License

Released under the [MIT License](LICENSE).
