# Accessibility Statement for LocalPDF

LocalPDF is committed to ensuring digital accessibility for people of all abilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

## Measures to Support Accessibility

LocalPDF takes the following measures to ensure accessibility:
- Include accessibility throughout our internal design and development process.
- Implement semantic HTML5 markup across all PDF utilities and navigation components.
- Provide full keyboard navigation for dropzones, buttons, modal dialogs, and controls.
- Maintain high color contrast compliant with WCAG 2.1 Level AA.
- Support screen readers with descriptive ARIA attributes and live status regions.
- Ensure all PDF operations are fully functional without relying solely on color cues or drag-and-drop actions.

## Conformance Status

The **Web Content Accessibility Guidelines (WCAG)** defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.

LocalPDF strives to conform with **WCAG 2.1 Level AA**.

## Supported Environments & Assistive Technologies

LocalPDF is designed to be compatible with:
- Modern desktop and mobile browsers (Chrome, Edge, Firefox, Safari on Windows, macOS, Linux, Android, iOS).
- Screen readers including NVDA, JAWS, VoiceOver, and Orca.
- Standard operating system high-contrast modes and browser zoom up to 200%.

## Known Limitations and Alternatives

While LocalPDF strives to adhere to the accepted guidelines and standards for accessibility and usability:
- **Canvas-rendered PDF Previews**: PDF pages rendered via HTML5 canvas might not expose underlying text directly to screen readers. For accessible text extraction, we provide the dedicated **PDF to Text** (`/pdf-to-text`) and **PDF OCR** (`/pdf-ocr`) tools.
- **Complex Page Reordering**: Drag-and-drop reordering is supplemented with keyboard shortcuts and accessible index input controls.

## Feedback & Reporting Barriers

We welcome your feedback on the accessibility of LocalPDF. If you encounter accessibility barriers, please let us know:
- **Email**: accessibility@localpdf.dev
- **GitHub Issues**: [Open an Accessibility Issue](https://github.com/shashidhar-02/LOCALPDF/issues)

We aim to respond to accessibility feedback within 2 business days.
