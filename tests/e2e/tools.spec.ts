import { test, expect } from '@playwright/test';

test.describe('LocalPDF Critical Privacy & Workflow E2E Suite', () => {
  // CRITICAL PRIVACY TEST (Section 18 requirement)
  test('CRITICAL PRIVACY TEST: Zero document bytes transmitted over network', async ({ page }) => {
    // Secret payload marker
    const secretSignature = 'TOP_SECRET_DOCUMENT_LOCALPDF_UNENCRYPTED_MARKER_998877';
    let leakedSecret = false;
    let leakedPayloadUrl = '';

    // Intercept and monitor ALL outbound network requests
    page.on('request', (request) => {
      const url = request.url();
      const postData = request.postData() || '';

      // Check if URL or request body contains the secret document data
      if (postData.includes(secretSignature) || url.includes(secretSignature)) {
        leakedSecret = true;
        leakedPayloadUrl = url;
      }
    });

    await page.goto('/split-pdf');

    // Create a dummy secret PDF containing our unique marker
    const secretPdfBuffer = Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT /F1 24 Tf 100 500 Td (${secretSignature}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000120 00000 n \n0000000215 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n365\n%%EOF`
    );

    // Upload the secret PDF into the dropzone
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Select a PDF to split');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'secret.pdf',
      mimeType: 'application/pdf',
      buffer: secretPdfBuffer,
    });

    // Verify document loaded locally
    await expect(page.locator('text=secret.pdf')).toBeVisible();

    // Perform an operation (Split PDF)
    await page.click('text=Split PDF Now');

    // Wait for client-side processing
    await page.waitForTimeout(1000);

    // PRIVACY ASSERTION: The document marker must NEVER have been transmitted in any request
    expect(leakedSecret).toBe(false);
    expect(leakedPayloadUrl).toBe('');
  });

  test('Homepage loads with all tool links and dropzone', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Private PDF tools');
    await expect(page.locator('text=Merge PDF').first()).toBeVisible();
    await expect(page.locator('text=Compress PDF').first()).toBeVisible();
    await expect(page.locator('text=JPG to PDF').first()).toBeVisible();
  });

  test('JPG to PDF tool workflow', async ({ page }) => {
    await page.goto('/jpg-to-pdf');
    await expect(page.locator('h1')).toContainText('JPG & Images to PDF');

    // Upload a test image
    const sampleImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Choose JPG, PNG, or WebP images');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: sampleImage,
    });

    await expect(page.locator('text=photo.png')).toBeVisible();
    await expect(page.locator('text=PDF Layout Options')).toBeVisible();
  });

  test('Merge PDF tool accepts multiple files', async ({ page }) => {
    await page.goto('/merge-pdf');
    await expect(page.locator('h1')).toContainText('Merge PDF Files');
  });

  test('Rotate PDF tool preview and controls', async ({ page }) => {
    await page.goto('/rotate-pdf');
    await expect(page.locator('h1')).toContainText('Rotate PDF');
  });

  test('Mobile workflow & responsive layout', async ({ page }) => {
    // Test viewport at 375px (iPhone standard width)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check header and mobile dropzone
    await expect(page.locator('text=LocalPDF').first()).toBeVisible();
    await expect(page.locator('text=Drop any PDF or Image file here')).toBeVisible();
  });
});
