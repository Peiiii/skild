import type { Env } from "./env.js";
import { buildLinkedInstall } from "./discover-items.js";
import { buildGithubUrl, normalizePath, normalizeRef, normalizeRepo } from "./github-utils.js";

type AwesomeLink = {
  title: string;
  description: string;
  url: string;
};

type ParsedGithubLink = {
  repo: string;
  path: string | null;
  ref: string | null;
  url: string;
};

type AwesomeDiscoveryResult = {
  scanned: number;
  discovered: number;
  failed: Array<{ repo: string; url: string; error: string }>;
};

const DEFAULT_AWESOME_REPOS = [
  "ComposioHQ/awesome-claude-skills",
  "travisvn/awesome-claude-skills",
  "VoltAgent/awesome-claude-skills",
  "heilcheng/awesome-agent-skills",
];

const SKIP_REPO_PATH_PREFIXES = [".agent/skills", ".opencode/skills", ".cursor/skills", ".vscode/skills"];
const SKIP_GITHUB_SECTIONS = new Set([
  "issues",
  "pull",
  "pulls",
  "discussions",
  "wiki",
  "actions",
  "releases",
  "compare",
  "commit",
  "commits",
  "security",
  "projects",
  "insights",
]);

function decodeBase64(base64: string): string {
  const normalized = base64.replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function normalizeGithubUrl(raw: string): string | null {
  let value = (raw || "").trim();
  if (!value) return null;
  if (value.startsWith("github.com/")) value = `https://${value}`;
  if (!value.startsWith("http://") && !value.startsWith("https://")) return null;
  while (/[).,;!?]$/.test(value)) value = value.slice(0, -1);
  return value;
}

function sanitizeText(input: string, maxLen: number): string {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function extractMarkdownLinks(markdown: string): AwesomeLink[] {
  const links: AwesomeLink[] = [];
  const seen = new Set<string>();
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const markdownLink = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = markdownLink.exec(line)) !== null) {
      const rawUrl = normalizeGithubUrl(match[2] || "");
      if (!rawUrl || !rawUrl.includes("github.com/")) continue;
      if (seen.has(rawUrl)) continue;
      seen.add(rawUrl);

      const title = sanitizeText(match[1] || "", 80);
      const tail = line.slice(match.index + match[0].length);
      const description = sanitizeText(tail.replace(/^(\s*[-–—:|]+)\s*/, ""), 240);
      links.push({ title, description, url: rawUrl });
    }

    const rawLink = /(https?:\/\/github\.com\/[^\s)]+|github\.com\/[^\s)]+)/gi;
    while ((match = rawLink.exec(line)) !== null) {
      const rawUrl = normalizeGithubUrl(match[1] || "");
      if (!rawUrl || !rawUrl.includes("github.com/")) continue;
      if (seen.has(rawUrl)) continue;
      seen.add(rawUrl);

      const tail = line.slice(match.index + match[0].length);
      const description = sanitizeText(tail.replace(/^(\s*[-–—:|]+)\s*/, ""), 240);
      links.push({ title: "", description, url: rawUrl });
    }
  }

  return links;
}

function parseGithubLink(rawUrl: string): ParsedGithubLink | null {
  const normalizedUrl = normalizeGithubUrl(rawUrl);
  if (!normalizedUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com") return null;

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  let repo: string;
  try {
    repo = normalizeRepo(`${parts[0]}/${parts[1]}`);
  } catch {
    return null;
  }

  let ref: string | null = null;
  let path: string | null = null;

  if (parts.length >= 3) {
    const section = parts[2];
    if (section === "tree" || section === "blob") {
      try {
        ref = normalizeRef(parts[3] || null);
        path = normalizePath(parts.slice(4).join("/"));
      } catch {
        return null;
      }
      if (section === "blob") {
        const segments = (path || "").split("/").filter(Boolean);
        segments.pop();
        path = normalizePath(segments.join("/"));
      }
    } else if (SKIP_GITHUB_SECTIONS.has(section)) {
      return null;
    } else {
      return null;
    }
  }

  const url = ref ? buildGithubUrl({ repo, path, ref }) : `https://github.com/${repo}`;
  return { repo, path, ref, url };
}

function buildSourceId(input: { repo: string; path: string | null; ref: string | null }): string {
  const pathPart = input.path ?? "";
  const refPart = input.ref ? `#${input.ref}` : "";
  return `github:${input.repo}:${pathPart}${refPart}`;
}

function resolveTitle(link: AwesomeLink, parsed: ParsedGithubLink): string {
  if (link.title) return link.title;
  if (parsed.path) {
    const segment = parsed.path.split("/").filter(Boolean).pop();
    if (segment) return segment;
  }
  return parsed.repo.split("/")[1] || parsed.repo;
}

function shouldSkipPath(path: string | null): boolean {
  if (!path) return false;
  const normalized = path.replace(/^\/+/, "");
  return SKIP_REPO_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

async function fetchReadme(env: Env, repo: string): Promise<string | null> {
  const token = (env.GITHUB_TOKEN || "").trim();
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "skild-registry",
      Accept: "application/vnd.github+json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub README fetch failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { content?: string; encoding?: string; download_url?: string };
  if (json.encoding === "base64" && json.content) {
    return decodeBase64(json.content);
  }
  if (json.download_url) {
    const raw = await fetch(json.download_url);
    if (!raw.ok) return null;
    return raw.text();
  }
  return null;
}

function resolveAwesomeRepos(env: Env): string[] {
  const raw = (env.AWESOME_REPOS || "").trim();
  if (raw) {
    return raw
      .split(",")
      .map(v => v.trim())
      .filter(Boolean)
      .map(normalizeRepo);
  }
  return DEFAULT_AWESOME_REPOS.map(normalizeRepo);
}

async function upsertDiscoverItems(
  env: Env,
  repo: string,
  items: Array<{ link: AwesomeLink; parsed: ParsedGithubLink }>,
): Promise<AwesomeDiscoveryResult> {
  const now = new Date().toISOString();
  let discovered = 0;
  const failed: Array<{ repo: string; url: string; error: string }> = [];

  const statements: D1PreparedStatement[] = [];
  const flush = async (): Promise<void> => {
    if (!statements.length) return;
    const batch = statements.splice(0, statements.length);
    await env.DB.batch(batch);
  };

  for (const item of items) {
    if (item.parsed.repo === repo) continue;
    if (shouldSkipPath(item.parsed.path)) continue;

    const sourceId = buildSourceId(item.parsed);
    const skillDir = item.parsed.path ?? "";
    const title = resolveTitle(item.link, item.parsed);
    const description = sanitizeText(item.link.description, 500);
    const install = buildLinkedInstall({
      repo: item.parsed.repo,
      path: item.parsed.path,
      ref: item.parsed.ref,
    });

    statements.push(
      env.DB.prepare(
        "INSERT INTO discovered_skills (id, repo, skill_dir, skill_name, source_ref, source_url, discovered_at, last_seen, updated_at)\n" +
          "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)\n" +
          "ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at, source_url = excluded.source_url, source_ref = excluded.source_ref",
      ).bind(sourceId, item.parsed.repo, skillDir, title, item.parsed.ref, item.parsed.url, now, now, now),
    );

    statements.push(
      env.DB.prepare(
        "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, skillset, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
          "VALUES ('linked', ?1, ?2, ?3, ?4, ?5, NULL, 0, ?6, ?7, ?8, ?9, ?10, ?10, ?10)\n" +
          "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, install = excluded.install, source_repo = excluded.source_repo, source_path = excluded.source_path, source_ref = excluded.source_ref, source_url = excluded.source_url, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
      ).bind(sourceId, title, description, "[]", install, item.parsed.repo, item.parsed.path, item.parsed.ref, item.parsed.url, now),
    );

    discovered += 1;
    if (statements.length >= 50) {
      try {
        await flush();
      } catch (err) {
        failed.push({ repo, url: item.parsed.url, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  try {
    await flush();
  } catch (err) {
    failed.push({ repo, url: repo, error: err instanceof Error ? err.message : String(err) });
  }

  return { scanned: items.length, discovered, failed };
}

export async function discoverAwesomeSkills(env: Env, input?: { repos?: string[] }): Promise<AwesomeDiscoveryResult> {
  const repos = (input?.repos && input.repos.length > 0 ? input.repos : resolveAwesomeRepos(env)).map(normalizeRepo);
  const failed: Array<{ repo: string; url: string; error: string }> = [];
  let scanned = 0;
  let discovered = 0;

  for (const repo of repos) {
    try {
      const markdown = await fetchReadme(env, repo);
      if (!markdown) continue;
      const links = extractMarkdownLinks(markdown)
        .map(link => ({ link, parsed: parseGithubLink(link.url) }))
        .filter((item): item is { link: AwesomeLink; parsed: ParsedGithubLink } => Boolean(item.parsed));

      const unique = new Map<string, { link: AwesomeLink; parsed: ParsedGithubLink }>();
      for (const item of links) {
        const key = buildSourceId(item.parsed);
        if (!unique.has(key)) unique.set(key, item);
      }

      const items = Array.from(unique.values());
      scanned += items.length;
      const result = await upsertDiscoverItems(env, repo, items);
      discovered += result.discovered;
      failed.push(...result.failed);
    } catch (err) {
      failed.push({ repo, url: repo, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { scanned, discovered, failed };
}
