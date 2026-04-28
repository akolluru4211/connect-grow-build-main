/**
 * Escape special characters in search strings for PostgREST ILIKE queries.
 * This prevents potential filter injection and syntax errors.
 * 
 * Characters escaped:
 * - % and _ are SQL wildcards
 * - , . ( ) | are PostgREST filter syntax characters
 * - Backslash is the escape character
 */
export function escapeSearchQuery(search: string): string {
  if (!search) return '';
  
  // Escape backslashes first, then other special characters
  return search
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/\./g, '\\.')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\|/g, '\\|');
}

/**
 * Build a safe ILIKE pattern with wildcards.
 * Escapes the search term and wraps with % for partial matching.
 */
export function buildIlikePattern(search: string): string {
  return `%${escapeSearchQuery(search)}%`;
}
