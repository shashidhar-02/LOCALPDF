import { describe, it, expect } from 'vitest';
import { parsePageRange, formatPageRange } from '@/lib/page-ranges';

describe('Page Range Parser & Formatter', () => {
  it('correctly parses comma-separated numbers and ranges like "1, 3, 5-8, 10-12"', () => {
    const { pages, errors } = parsePageRange('1, 3, 5-8, 10-12', 20);
    expect(errors).toHaveLength(0);
    expect(pages).toEqual([1, 3, 5, 6, 7, 8, 10, 11, 12]);
  });

  it('handles spaces and single-page inputs', () => {
    const { pages, errors } = parsePageRange('  4  ', 10);
    expect(errors).toHaveLength(0);
    expect(pages).toEqual([4]);
  });

  it('deduplicates overlapping pages and returns sorted order', () => {
    const { pages, errors } = parsePageRange('3, 1-4, 2', 10);
    expect(errors).toHaveLength(0);
    expect(pages).toEqual([1, 2, 3, 4]);
  });

  it('reports error on invalid range numbers and inverted bounds', () => {
    const res1 = parsePageRange('8-3', 10);
    expect(res1.errors.length).toBeGreaterThan(0);
    expect(res1.errors[0]).toContain('Start page cannot be greater');

    const res2 = parsePageRange('abc-5', 10);
    expect(res2.errors.length).toBeGreaterThan(0);
  });

  it('rejects page numbers exceeding total document page count', () => {
    const { errors } = parsePageRange('25', 10);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('exceeds document total of 10 pages');
  });

  it('formats array of page numbers into compact human-readable ranges', () => {
    expect(formatPageRange([1, 2, 3, 4])).toBe('1-4');
    expect(formatPageRange([1, 3, 5, 6, 7, 8, 10])).toBe('1, 3, 5-8, 10');
    expect(formatPageRange([])).toBe('');
  });
});
