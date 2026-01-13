# Skild Hub Guide

The **Skild Hub** ([hub.skild.sh](https://hub.skild.sh)) is the web interface for discovering, browsing, and publishing Agent Skills.

---

## Features

### 🔍 Discover Skills

Browse the registry to find Skills for your agents:

1. Go to [hub.skild.sh](https://hub.skild.sh)
2. Click **Discover** in the navigation
3. Search by name, description, or tags
4. Click on a Skill to view details
5. Copy the install command

### 📦 Catalog (Linked Skills)

The **Catalog** contains curated Skills from GitHub that haven't been formally published to the registry. See [Linked Skills Guide](./linked-skills.md) for details.

### 📤 Publish Skills

Publish your Skills to the registry:

1. **Create an account** — Click "Sign up" and fill in your details
2. **Verify your email** — Check your inbox for the verification link
3. **Publish** — Use the CLI or Hub to publish

```bash
# CLI publishing
skild login
skild publish --dir ./my-skill
```

Or use the Hub's **Publish** page for a guided experience.

---

## Navigation

| Menu | Description |
|------|-------------|
| **Discover** | Browse and search published Skills |
| **Catalog** | Browse curated GitHub Skills |
| **Publish** | Publish your Skills to the registry |
| **@handle ▼** | (When logged in) Access Dashboard, My Skills, Tokens, Settings |

---

## Account Management

After logging in, click your handle in the top-right to access:

- **Dashboard** — Overview of your account
- **My Skills** — Manage your published Skills
- **Tokens** — Create API tokens for CLI authentication
- **Settings** — Update account information

---

## Tips

- **Copy commands easily** — Every Skill has a "Copy" button for the install command
- **View on GitHub** — Linked Skills show the upstream GitHub repository
- **Search syntax** — Search matches title, description, and tags
