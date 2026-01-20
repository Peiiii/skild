import type { Env } from "./env.js";
import { sha256Hex } from "./crypto.js";
import {
  formatCategoryLabel,
  isDefaultCategoryId,
  normalizeCategoryId,
  normalizeCategorySlug,
  slugifyCategoryLabel,
} from "./catalog-category.js";
import {
  listCatalogCategoryOptions,
  listCatalogSkillsForCategoryTagging,
  updateCatalogSkillCategory,
  upsertCatalogCategory,
} from "./catalog-db.js";

type CatalogCategoryInput = {
  name: string;
  description: string;
  tags: string[];
  topics: string[];
  repo: string;
  path: string;
};

type CatalogCategoryOption = {
  id: string;
  label: string;
  description: string;
};

type CatalogCategoryChoice = {
  id: string;
  label: string;
  description: string;
  isNew: boolean;
};

export type CatalogCategoryTaggingResult = {
  scanned: number;
  tagged: number;
  errors: string[];
};

const DASHSCOPE_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
const DEFAULT_MODEL = "qwen-flash";

function parseEnvInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt((value || "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(input: string, maxLen: number): string {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen);
}

function parseJsonArray(input: string | null | undefined): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "string");
  } catch {
    return [];
  }
}

function shouldForceBlockchain(input: CatalogCategoryInput): boolean {
  const haystack = [input.name, input.description, ...input.tags, ...input.topics]
    .join(" ")
    .toLowerCase();
  return /\b(blockchain|web3|crypto|defi|smart contract|smart-contract|wallet|ethereum|solana|bitcoin)\b/.test(haystack);
}

function buildPrompt(input: CatalogCategoryInput, categories: CatalogCategoryOption[]): string {
  const categoryLines = categories
    .map((def) => `- ${def.id}: ${def.label} (${def.description})`)
    .join("\n");
  const name = sanitizeText(input.name, 120);
  const description = sanitizeText(input.description, 600);
  const tags = input.tags.slice(0, 12).join(", ");
  const topics = input.topics.slice(0, 12).join(", ");
  const repo = sanitizeText(input.repo, 120);
  const path = sanitizeText(input.path || "/", 180);

  return [
    "You are classifying agent skills into a single category.",
    "Pick exactly one category id from the list.",
    "If none fit, propose a NEW category with a kebab-case id.",
    "If the skill is about blockchain/web3/crypto, use category id \"blockchain\".",
    "If the skill is a distinct vertical (blockchain/web3/crypto, finance, legal, healthcare, gaming, robotics), propose a new category instead of forcing it into design/engineering.",
    "",
    "Category rules:",
    "- id must be lowercase kebab-case, <= 32 chars",
    "- prefer concise domain ids for new categories (e.g. blockchain, finance)",
    "- label should be a short title",
    "- description should be <= 120 chars",
    "",
    "Categories:",
    categoryLines,
    "",
    "Skill:",
    `name: ${name}`,
    `description: ${description}`,
    `tags: ${tags || "none"}`,
    `topics: ${topics || "none"}`,
    `repo: ${repo}`,
    `path: ${path}`,
    "",
    "Return ONLY JSON.",
    "Existing: {\"category\": {\"id\": \"data\"}}",
    "New: {\"category\": {\"id\": \"blockchain\", \"label\": \"Blockchain\", \"description\": \"Chains, protocols, wallets, and Web3 tooling\", \"is_new\": true}}",
  ].join("\n");
}

function extractDashScopeContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as {
    output?: { text?: string; choices?: Array<{ message?: { content?: string }; text?: string }> };
  };
  const output = data.output;
  if (!output) return null;
  if (typeof output.text === "string") return output.text;
  const choice = output.choices && output.choices[0];
  if (!choice) return null;
  if (choice.message && typeof choice.message.content === "string") return choice.message.content;
  if (typeof choice.text === "string") return choice.text;
  return null;
}

function normalizeChoice(
  raw: unknown,
  known: CatalogCategoryOption[],
): CatalogCategoryChoice | null {
  if (!raw) return null;
  const byId = new Map(known.map((item) => [item.id.toLowerCase(), item]));
  const byLabel = new Map(known.map((item) => [item.label.toLowerCase(), item.id.toLowerCase()]));

  const resolveExisting = (value: string): CatalogCategoryChoice | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalizedExisting = normalizeCategoryId(trimmed);
    if (normalizedExisting && byId.has(normalizedExisting)) {
      const match = byId.get(normalizedExisting)!;
      return {
        id: match.id,
        label: match.label,
        description: match.description,
        isNew: false,
      };
    }
    const slugMatch = normalizeCategorySlug(trimmed);
    if (slugMatch && byId.has(slugMatch)) {
      const match = byId.get(slugMatch)!;
      return {
        id: match.id,
        label: match.label,
        description: match.description,
        isNew: false,
      };
    }
    const labelMatch = byLabel.get(trimmed.toLowerCase());
    if (labelMatch && byId.has(labelMatch)) {
      const match = byId.get(labelMatch)!;
      return {
        id: match.id,
        label: match.label,
        description: match.description,
        isNew: false,
      };
    }
    return null;
  };

  if (typeof raw === "string") {
    const existing = resolveExisting(raw);
    if (existing) return existing;
    const slug = normalizeCategorySlug(raw);
    if (!slug) return null;
    const label = formatCategoryLabel(slug) || slug;
    return {
      id: slug,
      label,
      description: "",
      isNew: !byId.has(slug),
    };
  }

  if (typeof raw === "object") {
    const data = raw as {
      id?: string;
      slug?: string;
      name?: string;
      label?: string;
      description?: string;
      is_new?: boolean;
      isNew?: boolean;
    };

    const direct = data.id || data.slug || data.name || "";
    const fromExisting = resolveExisting(direct);
    if (fromExisting) return fromExisting;

    let id = normalizeCategorySlug(direct);
    const labelInput = (data.label || "").trim();
    if (!id && labelInput) {
      id = slugifyCategoryLabel(labelInput);
    }
    if (!id && direct) {
      id = slugifyCategoryLabel(direct);
    }
    if (!id) return null;

    const knownMatch = byId.get(id);
    const label = labelInput || knownMatch?.label || formatCategoryLabel(id) || id;
    const description = sanitizeText(data.description || knownMatch?.description || "", 200);
    const isNew = Boolean(data.is_new ?? data.isNew ?? !byId.has(id));

    return {
      id,
      label,
      description,
      isNew,
    };
  }

  return null;
}

function parseCategoryFromContent(content: string, known: CatalogCategoryOption[]): CatalogCategoryChoice | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();

  if (candidate.startsWith("{")) {
    try {
      const parsed = JSON.parse(candidate) as { category?: unknown };
      if (parsed && parsed.category !== undefined) {
        const normalized = normalizeChoice(parsed.category, known);
        if (normalized) return normalized;
      }
    } catch {
      // fall through
    }
  }

  return normalizeChoice(candidate, known);
}

async function classifyCatalogCategoryAi(
  env: Env,
  input: CatalogCategoryInput,
  categories: CatalogCategoryOption[],
): Promise<{ choice: CatalogCategoryChoice | null; model: string; promptDigest: string; raw: string | null }> {
  const apiKey = (env.DASHSCOPE_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY.");
  }
  const model = (env.DASHSCOPE_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const prompt = buildPrompt(input, categories);
  const promptDigest = await sha256Hex(new TextEncoder().encode(prompt).buffer);

  const res = await fetch(DASHSCOPE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          { role: "system", content: "You output only JSON with a category id." },
          { role: "user", content: prompt },
        ],
      },
      parameters: {
        temperature: 0.2,
        result_format: "message",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DashScope error ${res.status}: ${text}`);
  }

  const payload = (await res.json()) as unknown;
  const content = extractDashScopeContent(payload);
  const choice = content ? parseCategoryFromContent(content, categories) : null;
  return { choice, model, promptDigest, raw: content };
}

export async function tagCatalogSkillCategories(
  env: Env,
  options?: { limit?: number; delayMs?: number; force?: boolean; repo?: string | null; skillId?: string | null },
): Promise<CatalogCategoryTaggingResult> {
  const batchSize = parseEnvInt(env.CATALOG_TAGGING_BATCH_SIZE, 10, 1, 200);
  const delayMs = parseEnvInt(env.CATALOG_TAGGING_DELAY_MS, 0, 0, 3000);
  const limit = options?.limit ?? batchSize;
  const delay = options?.delayMs ?? delayMs;
  const errors: string[] = [];
  const apiKey = (env.DASHSCOPE_API_KEY || "").trim();
  if (!apiKey) {
    return { scanned: 0, tagged: 0, errors: ["Missing DASHSCOPE_API_KEY."] };
  }

  const categories = await listCatalogCategoryOptions(env);
  const candidates = await listCatalogSkillsForCategoryTagging(env, {
    limit,
    force: options?.force,
    repo: options?.repo ?? null,
    skillId: options?.skillId ?? null,
  });
  let tagged = 0;
  for (const candidate of candidates) {
    if (!candidate.name || !candidate.description) continue;
    const tags = parseJsonArray(candidate.tags_json);
    const topics = parseJsonArray(candidate.topics_json);
    try {
      const result = await classifyCatalogCategoryAi(
        env,
        {
          name: candidate.name,
          description: candidate.description,
          tags,
          topics,
          repo: candidate.repo,
          path: candidate.path,
        },
        categories,
      );

      const resolved = result.choice ?? {
        id: "other",
        label: "Other",
        description: "",
        isNew: false,
      };
      let categoryId = normalizeCategoryId(resolved.id) || normalizeCategorySlug(resolved.id) || "other";
      let isNew = resolved.isNew && !isDefaultCategoryId(categoryId);
      let label = resolved.label || formatCategoryLabel(categoryId) || categoryId;
      let description = sanitizeText(resolved.description || "", 200);

      let tagSource = result.choice ? "ai" : "ai-fallback";
      if (categoryId !== "blockchain" && shouldForceBlockchain({
        name: candidate.name,
        description: candidate.description,
        tags,
        topics,
        repo: candidate.repo,
        path: candidate.path,
      })) {
        categoryId = "blockchain";
        isNew = false;
        label = formatCategoryLabel(categoryId) || categoryId;
        description = "";
        tagSource = "ai-override";
      }

      if (isNew) {
        await upsertCatalogCategory(env, {
          id: categoryId,
          label,
          description,
          source: "ai",
        });
        categories.push({ id: categoryId, label, description });
      } else if (!isDefaultCategoryId(categoryId)) {
        await upsertCatalogCategory(env, {
          id: categoryId,
          label,
          description,
          source: "ai",
        });
      }

      await updateCatalogSkillCategory(env, {
        id: candidate.id,
        category: categoryId,
        tagSource,
        aiTaggedAt: new Date().toISOString(),
        aiModel: result.model,
        promptDigest: result.promptDigest,
        force: options?.force,
      });
      tagged += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
    if (delay > 0) await sleep(delay);
  }

  return { scanned: candidates.length, tagged, errors };
}
