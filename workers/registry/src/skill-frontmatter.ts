export type SkillFrontmatter = {
  name?: string;
  description?: string;
  tags?: string[];
  skillset?: boolean;
  dependencies?: string[];
};

type BlockMode = "literal" | "folded";

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

function isBlockIndicator(value: string): BlockMode | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const first = trimmed[0];
  if (first === "|") return "literal";
  if (first === ">") return "folded";
  return null;
}

function countIndent(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === " " || ch === "\t") count += 1;
    else break;
  }
  return count;
}

function finalizeBlock(mode: BlockMode, lines: string[]): string {
  if (lines.length === 0) return "";
  if (mode === "literal") return lines.join("\n").trimEnd();

  let out = "";
  let pendingBlank = false;
  for (const line of lines) {
    if (line === "") {
      out += "\n";
      pendingBlank = true;
      continue;
    }
    if (out && !pendingBlank) out += " ";
    out += line;
    pendingBlank = false;
  }
  return out.trimEnd();
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
  let blockKey: "name" | "description" | null = null;
  let blockMode: BlockMode | null = null;
  let blockIndent: number | null = null;
  let blockLines: string[] = [];

  function flushBlock(): void {
    if (!blockKey || !blockMode) return;
    const value = finalizeBlock(blockMode, blockLines).trim();
    if (value) {
      if (blockKey === "name") result.name = value;
      if (blockKey === "description") result.description = value;
    }
    blockKey = null;
    blockMode = null;
    blockIndent = null;
    blockLines = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";

    if (blockMode) {
      const trimmedLine = rawLine.trimEnd();
      if (trimmedLine === "") {
        blockLines.push("");
        continue;
      }
      const indent = countIndent(rawLine);
      if (blockIndent === null) {
        if (indent === 0) {
          flushBlock();
          i -= 1;
          continue;
        }
        blockIndent = indent;
      } else if (indent < blockIndent) {
        flushBlock();
        i -= 1;
        continue;
      }
      blockLines.push(rawLine.slice(blockIndent));
      continue;
    }

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
    if (key === "name" || key === "description") {
      const block = isBlockIndicator(value);
      if (block) {
        blockKey = key;
        blockMode = block;
        blockIndent = null;
        blockLines = [];
        continue;
      }
    }

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

  flushBlock();
  return Object.keys(result).length ? result : null;
}
