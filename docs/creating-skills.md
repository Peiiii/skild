# Creating Skills

This guide covers how to create high-quality Agent Skills for the skild ecosystem.

---

## Quick Start

```bash
# Create a new Skill
skild init my-skill
cd my-skill

# Validate structure
skild validate .

# Test locally
skild install ./my-skill --local
```

---

## Skill Structure

A minimal Skill requires a `SKILL.md` file:

```
my-skill/
├── SKILL.md          # Required: Main skill definition
├── assets/           # Optional: Images, diagrams
├── references/       # Optional: Additional context files
└── scripts/          # Optional: Executable scripts
```

---

## SKILL.md Format

```markdown
---
name: my-skill
description: What this skill does
version: 0.1.0
---

# My Skill

Instructions for the AI agent on how to use this skill.

## When to Use

Describe the scenarios where this skill should be activated.

## How to Use

Step-by-step instructions or examples.

## Examples

\`\`\`
Example input/output pairs or usage patterns.
\`\`\`
```

---

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Skill identifier (lowercase, hyphens) |
| `description` | Yes | One-line description |
| `version` | Yes | Semver version (e.g., `1.0.0`) |
| `author` | No | Author name or handle |
| `license` | No | License identifier (e.g., `MIT`) |
| `tags` | No | Array of tags for discovery |

---

## Best Practices

### 1. Clear Activation Criteria

Tell the agent exactly when to use this skill:

```markdown
## When to Use

Use this skill when:
- Processing PDF documents
- Extracting text from uploaded PDFs
- Generating PDF reports
```

### 2. Structured Instructions

Break down complex skills into clear sections:

- **Prerequisites** — What the agent needs before starting
- **Steps** — Numbered, actionable instructions
- **Edge Cases** — How to handle errors or unusual inputs
- **Examples** — Concrete input/output pairs

### 3. Include References

For complex skills, add supporting files:

```
references/
├── api-spec.md       # API documentation
├── examples.json     # Example data
└── troubleshooting.md
```

Reference them in SKILL.md:

```markdown
See [API specification](./references/api-spec.md) for endpoint details.
```

### 4. Test Thoroughly

Before publishing:

1. Install locally: `skild install ./my-skill --local`
2. Test with your target agent (Claude, Codex, Copilot)
3. Validate: `skild validate ./my-skill`

---

## Publishing

When your Skill is ready, publish it to share with the community:

```bash
skild publish
```

See **[Publishing Skills](./publishing-skills.md)** for the complete guide.

---

## Versioning

Use [Semantic Versioning](https://semver.org/):

- `1.0.0` → Initial release
- `1.0.1` → Bug fixes
- `1.1.0` → New features (backward compatible)
- `2.0.0` → Breaking changes

Update the `version` field in SKILL.md before each publish.
