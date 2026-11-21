# Contributing to LocalPDF

Thank you for your interest in contributing to **LocalPDF**! LocalPDF is an open-source, browser-only, 100% private PDF utility suite.

## Core Architectural Principles

Before writing code, please review our non-negotiable architectural tenets:
1. **Zero-Server Processing**: All PDF manipulation, rendering, OCR, splitting, merging, signing, and conversion MUST occur locally in the user's browser.
2. **Zero File Exfiltration**: Never send PDF documents, text, images, or telemetry containing file contents to any backend server, third-party analytics, or external AI APIs.
3. **Lazy Loading**: Heavy libraries (PDF.js, Tesseract.js, pdf-lib) must be loaded dynamically on demand to preserve fast initial page loads.
4. **Offline First**: The app must remain operable even without an active internet connection after initial asset load.

## Development Setup

1. **Prerequisites**: Node.js 20+ and npm.
2. **Clone & Install**:
   ```bash
   git clone https://github.com/shashidhar-02/LOCALPDF.git
   cd LOCALPDF
   npm ci
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Run Unit Tests**:
   ```bash
   npm test
   ```
5. **Lint & Type Check**:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
6. **Production Build**:
   ```bash
   npm run build
   ```

## Pull Request Process

1. Fork the repository and create your branch from `main` (e.g., `feature/custom-page-size` or `fix/split-page-range`).
2. Adhere to our standard commit messages (`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`).
3. Ensure all tests and linters pass without warnings.
4. Open a Pull Request referencing any related issues.
5. Our automated GitHub Actions CI & DevSecOps pipeline will run CodeQL, unit tests, linting, build checks, and DAST scans on your PR.

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect and empathy.
