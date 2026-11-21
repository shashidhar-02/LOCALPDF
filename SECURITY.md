# Security Policy & Vulnerability Disclosure

LocalPDF is built on a foundational promise: **Your documents never leave your browser.**
Maintaining document privacy and software security is paramount to the project.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Security Vulnerability

If you discover a security vulnerability, architectural flaw, or potential file exfiltration issue in LocalPDF, please **DO NOT** create a public GitHub issue.

Please report vulnerabilities privately via:
1. **GitHub Private Vulnerability Reporting**: [Submit an advisory](https://github.com/shashidhar-02/LOCALPDF/security/advisories/new)
2. **Email**: Send detailed information to `security@localpdf.dev`

Please include:
- A clear description of the vulnerability and potential impact.
- Step-by-step instructions or Proof of Concept (PoC) to reproduce the issue.
- Details regarding browser version and operating system.

## Vulnerability Handling Timeline

- **Initial Acknowledgment**: Within 48 hours.
- **Assessment & Triage**: Within 5 business days.
- **Remediation & Patch**: Target release within 14 business days.
- **Public Disclosure**: Coordinated disclosure following verified patch deployment.

## Security Architecture & Guarantees

- **No Remote Processing**: All document parsing is handled via Web Workers and WebAssembly in client memory.
- **Content Security Policy (CSP)**: Strict headers to mitigate cross-site scripting (XSS) and unauthorized remote connections.
- **Automated DevSecOps Pipeline**: Weekly and PR-gated security scans with GitHub CodeQL, Secret Scanning, Dependency Audits, and OWASP ZAP DAST scans.
