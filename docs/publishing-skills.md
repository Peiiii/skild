# Publishing Skills

Share your Skill with the community by publishing it to the Skild registry.

---

## Step 1: Sign up (first time only)

```bash
skild signup
```

Follow the prompts to enter your email, handle (username), and password.

---

## Step 2: Login

```bash
skild login
```

Enter your credentials when prompted.

---

## Step 3: Prepare your Skill

Make sure your Skill directory contains a `SKILL.md` file with frontmatter:

```markdown
---
name: my-skill
version: 1.0.0
description: What your skill does
---

# My Skill

Instructions for the AI agent...
```

> **Tip**: Use `skild init my-skill` to quickly create a template.

---

## Step 4: Publish

Navigate to your Skill directory and run:

```bash
skild publish
```

That's it! 🎉 The CLI reads your `SKILL.md` and publishes to `@yourhandle/my-skill`.

---

## Step 5: Test your published Skill

```bash
skild install @yourhandle/my-skill
```

---

## Advanced Options

| Use case | Command |
|----------|---------|
| Publish from a different directory | `skild publish --dir ./path/to/skill` |
| Override name | `skild publish --name my-new-name` |
| Override version | `skild publish --skill-version 2.0.0` |
| Publish to beta tag | `skild publish --tag beta` |

---

## Common Commands

```bash
skild signup      # Create account
skild login       # Login
skild whoami      # Check current login
skild init <name> # Create new Skill
skild validate    # Validate Skill structure
skild publish     # Publish
skild logout      # Logout
```

---

## Updating a Published Skill

1. Update the `version` field in your `SKILL.md`
2. Run `skild publish` again

Use [Semantic Versioning](https://semver.org/):
- `1.0.1` → Bug fixes
- `1.1.0` → New features (backward compatible)
- `2.0.0` → Breaking changes
