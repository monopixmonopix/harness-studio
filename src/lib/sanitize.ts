/**
 * Sanitize a user-provided name for use as a filename.
 * Strips path separators, traversal sequences, and control characters.
 * Allows Unicode word characters (CJK, Latin, etc.) plus safe punctuation.
 * Returns null if the name is empty after sanitization.
 */
export function sanitizeFileName(name: string): string | null {
  // Remove path separators and traversal sequences
  const sanitized = name
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[\x00-\x1f\x7f<>:"|?*]/g, '-')
    .trim();

  if (sanitized === '' || sanitized === '.' || sanitized === '..') {
    return null;
  }

  return sanitized;
}
