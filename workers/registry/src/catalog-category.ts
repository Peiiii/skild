export type CatalogCategoryDefinition = {
  id: string;
  label: string;
  description: string;
};

const CATEGORY_DEFINITIONS: CatalogCategoryDefinition[] = [
  {
    id: "data",
    label: "Data",
    description: "Data extraction, analytics, databases, and pipelines.",
  },
  {
    id: "engineering",
    label: "Engineering",
    description: "Software development, APIs, and build tooling.",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Deployment, infrastructure, and operations workflows.",
  },
  {
    id: "blockchain",
    label: "Blockchain",
    description: "Chains, protocols, wallets, and Web3 tooling.",
  },
  {
    id: "ai-ml",
    label: "AI & ML",
    description: "Models, prompts, embeddings, and AI workflows.",
  },
  {
    id: "security",
    label: "Security",
    description: "Auth, vulnerability scanning, and compliance.",
  },
  {
    id: "productivity",
    label: "Productivity",
    description: "Office workflows, automation, and personal efficiency.",
  },
  {
    id: "design",
    label: "Design",
    description: "UI/UX, graphics, and creative tooling.",
  },
  {
    id: "content",
    label: "Content",
    description: "Writing, marketing, and communication.",
  },
  {
    id: "research",
    label: "Research",
    description: "Discovery, summarization, and knowledge work.",
  },
  {
    id: "business",
    label: "Business",
    description: "Sales, operations, and company workflows.",
  },
  {
    id: "education",
    label: "Education",
    description: "Teaching, learning, and training.",
  },
  {
    id: "support",
    label: "Support",
    description: "Customer support and service ops.",
  },
  {
    id: "other",
    label: "Other",
    description: "Everything else.",
  },
];

const CATEGORY_INDEX = new Map(CATEGORY_DEFINITIONS.map(def => [def.id, def]));
const CATEGORY_LABEL_INDEX = new Map(CATEGORY_DEFINITIONS.map(def => [def.label.toLowerCase(), def.id]));

export function listCatalogCategoryDefinitions(): CatalogCategoryDefinition[] {
  return CATEGORY_DEFINITIONS.slice();
}

export function isDefaultCategoryId(input: string | null | undefined): boolean {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return false;
  return CATEGORY_INDEX.has(raw);
}

export function normalizeCategorySlug(input: string | null | undefined): string | null {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)) return null;
  if (raw.length > 32) return null;
  return raw;
}

export function slugifyCategoryLabel(input: string | null | undefined): string | null {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return null;
  const slug = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return normalizeCategorySlug(slug);
}

export function formatCategoryLabel(input: string | null | undefined): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  return raw
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeCategoryId(input: string | null | undefined): string | null {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return null;
  if (CATEGORY_INDEX.has(raw)) return raw;
  const byLabel = CATEGORY_LABEL_INDEX.get(raw);
  if (byLabel) return byLabel;
  return null;
}
