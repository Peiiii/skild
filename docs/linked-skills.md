# Linked Skills (Catalog)

**Linked Skills** are curated references to GitHub-hosted Skills. They appear in the Catalog for discovery, but install directly from GitHub.

---

## What are Linked Skills?

| Aspect | Description |
|--------|-------------|
| **Purpose** | Discover GitHub Skills without formal registry publishing |
| **Install method** | Directly from GitHub URL |
| **Publisher** | Original author (not skild) |
| **Submitted by** | Community contributor who added it to the catalog |

Linked Skills are useful for:
- Skills from official repositories (e.g., `anthropics/skills`)
- Community Skills that haven't been formally published
- Early discovery before authors create registry accounts

---

## Browsing the Catalog

1. Go to [console.skild.sh/linked](https://console.skild.sh/linked)
2. Browse or search for Skills
3. Click a Skill to view details
4. Copy the install command

---

## Installing Linked Skills

Linked Skills use GitHub URLs for installation:

```bash
# Example: Install the PDF skill from anthropics/skills
skild install anthropics/skills/skills/pdf

# Or use the full URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
```

---

## Contributing to the Catalog

Help grow the catalog by submitting high-quality GitHub Skills!

### Requirements

1. **Create an account** at [console.skild.sh](https://console.skild.sh)
2. **Find a GitHub Skill** with a valid `SKILL.md`
3. **Submit via Console**:
   - Go to **Catalog** → click **+ Submit**
   - Paste the GitHub URL
   - Click **Parse** to extract repo/path/ref
   - Optionally add title, description, tags
   - Click **Submit**

### URL Format

Supported GitHub URL formats:

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/main
https://github.com/owner/repo/tree/main/path/to/skill
https://github.com/owner/repo/tree/v1.0.0/path/to/skill
```

### Best Practices

- **Verify the Skill works** before submitting
- **Use descriptive tags** to help others find it
- **Check for duplicates** — don't submit the same Skill twice

---

## Linked vs Published Skills

| Feature | Linked Skills | Published Skills |
|---------|---------------|------------------|
| Source | GitHub URL | Registry tarball |
| Install command | `skild install owner/repo/path` | `skild install @publisher/skill` |
| Versioning | GitHub refs (tags/branches) | Semver in registry |
| Author verification | None | Publisher account |
| Catalog entry | Yes | Yes (in Discover) |

---

## For Skill Authors

If your Skill is in the Catalog and you want to formally publish it:

1. Create an account at [console.skild.sh](https://console.skild.sh)
2. Use `skild publish` to publish to the registry
3. Users can then install via `@yourhandle/skillname`

Published Skills get:
- Semantic versioning
- Download statistics
- Official publisher verification
