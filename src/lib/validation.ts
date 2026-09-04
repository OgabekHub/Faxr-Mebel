/**
 * Accepts Uzbek phone numbers written any common way
 * (+998 90 123 45 67, 998901234567, 90-123-45-67, 901234567)
 * and returns the canonical `+998XXXXXXXXX` form, or null when invalid.
 */
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local: string | null = null;
  if (digits.length === 9) local = digits;
  else if (digits.length === 12 && digits.startsWith('998')) local = digits.slice(3);
  if (!local || !/^[1-9]\d{8}$/.test(local)) return null;
  return `+998${local}`;
}

export function isValidUzPhone(input: string): boolean {
  return normalizeUzPhone(input) !== null;
}
