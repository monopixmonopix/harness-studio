/**
 * Ensures a value is a string array. Handles cases where YAML parsing
 * or other data sources may produce a single string instead of an array.
 */
export function ensureStringArray(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') return [value];
  return [];
}
