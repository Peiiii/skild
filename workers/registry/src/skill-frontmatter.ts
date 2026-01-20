export type SkillFrontmatter = {
  name?: string;
  description?: string;
  tags?: string[];
  skillset?: boolean;
  dependencies?: string[];
};

function normalizeScalar(value: string): string {
  let out = value.trim();
  if (!out) return "";
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  return out;
}

function parseInlineList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1);
    return inner
      .split(",")
      .map(item => normalizeScalar(item))
      .filter(Boolean);
  }
  const scalar = normalizeScalar(trimmed);
  if (!scalar) return [];
  if (scalar.includes(",")) {
    return scalar.split(",").map(item => normalizeScalar(item)).filter(Boolean);
  }
  return [scalar];
}

function parseBoolean(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export function parseSkillFrontmatter(content: string): SkillFrontmatter | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return null;
  const endIndex = trimmed.indexOf("\n---", 3);
  if (endIndex === -1) return null;

  const block = trimmed.slice(3, endIndex).trim();
  if (!block) return null;

  const result: SkillFrontmatter = {};
  const lines = block.split(/\r?\n/);
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.trim().startsWith("#")) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      const item = normalizeScalar(listMatch[1] || "");
      if (!item) continue;
      if (currentKey === "tags") {
        result.tags = [...(result.tags ?? []), item];
      } else if (currentKey === "dependencies") {
        result.dependencies = [...(result.dependencies ?? []), item];
      }
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1] || "";
    const value = match[2] ?? "";
    currentKey = key;

    if (key === "name") {
      const parsed = normalizeScalar(value);
      if (parsed) result.name = parsed;
      continue;
    }

    if (key === "description") {
      const parsed = normalizeScalar(value);
      if (parsed) result.description = parsed;
      continue;
    }

    if (key === "tags") {
      const parsed = parseInlineList(value);
      if (parsed.length) result.tags = parsed;
      continue;
    }

    if (key === "dependencies") {
      const parsed = parseInlineList(value);
      if (parsed.length) result.dependencies = parsed;
      continue;
    }

    if (key === "skillset") {
      const parsed = parseBoolean(value);
      if (parsed !== null) result.skillset = parsed;
    }
  }

  return Object.keys(result).length ? result : null;
}
