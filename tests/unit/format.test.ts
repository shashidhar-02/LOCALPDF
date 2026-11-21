import { describe, it, expect } from 'vitest';
import { formatBytes, calculateSavings, sanitizeFileName } from '@/lib/format';

describe('Format and Math Utilities', () => {
  it('formats byte numbers into human readable strings', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('calculates percentage savings correctly', () => {
    expect(calculateSavings(1000, 500)).toBe(50);
    expect(calculateSavings(1000, 750)).toBe(25);
    expect(calculateSavings(1000, 1000)).toBe(0);
    // When new file is larger, savings should be negative
    expect(calculateSavings(1000, 1200)).toBe(-20);
    expect(calculateSavings(0, 500)).toBe(0);
  });

  it('sanitizes unsafe file names', () => {
    expect(sanitizeFileName('../../malicious.pdf')).toBe('malicious.pdf');
    expect(sanitizeFileName('my report.pdf')).toBe('my_report.pdf');
    expect(sanitizeFileName('invoice')).toBe('invoice.pdf');
  });
});
