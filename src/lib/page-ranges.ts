/**
 * Parses a page range string like "1, 3, 5-8, 10-12" into an array of 1-based page numbers.
 * Validates against maxPages, filters duplicates, and returns sorted numbers.
 */
export function parsePageRange(rangeStr: string, maxPages: number): { pages: number[]; errors: string[] } {
  const errors: string[] = [];
  if (!rangeStr || !rangeStr.trim()) {
    return { pages: [], errors: ['Page range cannot be empty.'] };
  }

  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);
  const pageSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const rangeParts = part.split('-').map((p) => p.trim());
      if (rangeParts.length !== 2) {
        errors.push(`Invalid range syntax: "${part}"`);
        continue;
      }

      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      if (isNaN(start) || isNaN(end)) {
        errors.push(`Invalid numbers in range: "${part}"`);
        continue;
      }

      if (start < 1) {
        errors.push(`Page number cannot be less than 1 in "${part}"`);
        continue;
      }

      if (start > end) {
        errors.push(`Start page cannot be greater than end page in "${part}"`);
        continue;
      }

      if (start > maxPages) {
        errors.push(`Page ${start} exceeds total document pages (${maxPages})`);
        continue;
      }

      const clampedEnd = Math.min(end, maxPages);
      for (let p = start; p <= clampedEnd; p++) {
        pageSet.add(p);
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        errors.push(`Invalid page number: "${part}"`);
        continue;
      }
      if (page < 1) {
        errors.push(`Page number must be at least 1: "${part}"`);
        continue;
      }
      if (page > maxPages) {
        errors.push(`Page ${page} exceeds document total of ${maxPages} pages`);
        continue;
      }
      pageSet.add(page);
    }
  }

  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
  return { pages: sortedPages, errors };
}

/**
 * Converts an array of 1-based page numbers into a compact human-readable range string like "1, 3, 5-8, 10".
 */
export function formatPageRange(pages: number[]): string {
  if (!pages || pages.length === 0) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (start === prev) {
        ranges.push(`${start}`);
      } else if (prev === start + 1) {
        ranges.push(`${start}, ${prev}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = current;
      prev = current;
    }
  }

  return ranges.join(', ');
}
