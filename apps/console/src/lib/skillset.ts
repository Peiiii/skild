export function isSkillsetFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }
  return false;
}

export function parseJsonStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
  return [];
}

