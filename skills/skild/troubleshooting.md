# Troubleshooting

Common issues and solutions for skild.

## Installation Issues

### "skild: command not found"

skild is not installed globally.

```bash
npm install -g skild
```

Or use npx:

```bash
npx skild@latest --help
```

### "EACCES: permission denied"

Permission issue with global npm installation.

**Solution 1:** Use npm prefix
```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g skild
```

**Solution 2:** Use nvm (recommended)
```bash
nvm install 20
nvm use 20
npm install -g skild
```

### "Skill already exists"

The Skill is already installed.

```bash
# Force reinstall
skild install <source> --force
```

---

## Registry Issues

### "Email not verified"

Your email must be verified before publishing.

1. Go to [hub.skild.sh](https://hub.skild.sh)
2. Login and verify your email
3. Retry `skild publish`

### "Unauthorized" / "Invalid token"

Your login token may have expired.

```bash
skild logout
skild login
```

### Registry timeout

Check your network or try specifying the registry explicitly:

```bash
skild search pdf --registry https://registry.skild.sh
```

---

## Skill Structure Issues

### "Invalid skill: missing SKILL.md"

Every Skill must have a `SKILL.md` file at its root.

```bash
# Create a new Skill with proper structure
skild init my-skill
```

### "Invalid frontmatter"

SKILL.md requires valid YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does
version: 0.1.0
---
```

Required fields: `name`, `description`, `version`

---

## Platform Issues

### Wrong installation directory

Use `-t` to specify the target platform:

```bash
skild install <source> -t codex
skild install <source> -t antigravity
```

### Project vs Global

Use `--local` for project-level installation:

```bash
skild install <source> --local
```

---

## Debugging

### Verbose output

```bash
skild list --verbose --paths
```

### JSON output

```bash
skild install <source> --json
```

### Check version

```bash
skild --version
```

---

## Getting Help

- Documentation: [GitHub](https://github.com/Peiiii/skild/tree/main/docs)
- Issues: [GitHub Issues](https://github.com/Peiiii/skild/issues)
- Hub: [hub.skild.sh](https://hub.skild.sh)
