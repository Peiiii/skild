# skild Command Reference

Complete reference for all skild CLI commands.

---

## Installation Commands

### skild install

Install a Skill from various sources. Alias: `skild i`

```bash
skild install <source> [options]
# npm-style alias
skild add <source> [options]
```

**Sources:**
- GitHub shorthand: `owner/repo/path/to/skill`
- Full GitHub URL: `https://github.com/owner/repo/tree/main/path`
- Registry: `@publisher/skill-name` or `@publisher/skill-name@1.0.0`
- Local directory: `./path/to/skill`
- Alias: `superpowers` (resolves via registry)

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform: claude, codex, copilot, antigravity |
| `--all` | Install to all platforms |
| `--recursive` | If source is a multi-skill directory/repo (no root `SKILL.md`), install all discovered skills |
| `-y, --yes` | Skip confirmation prompts (assume yes) |
| `--depth <n>` | Max markdown recursion depth (default: 0) |
| `--scan-depth <n>` | Max directory depth to scan for `SKILL.md` (default: 6) |
| `--max-skills <n>` | Safety limit for discovered skills to install (default: 200) |
| `-l, --local` | Install to project directory (not global) |
| `-f, --force` | Overwrite existing installation |
| `--registry <url>` | Override registry URL |
| `--json` | Output in JSON format |

**Examples:**
```bash
# From GitHub
skild install anthropics/skills/skills/pdf

# From registry with specific version
skild install @peiiii/hello-skill@1.0.0

# To Antigravity, project-level
skild install @publisher/skill -t antigravity --local

# Force reinstall
skild install ./my-skill --force
```

---

### skild extract-github-skills

Extract GitHub skills into a local catalog directory (full contents per skill).

```bash
skild extract-github-skills <source> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--out <dir>` | Output directory (default: `./skild-github-skills`) |
| `-f, --force` | Overwrite existing output directory |
| `--depth <n>` | Max markdown recursion depth (default: 0) |
| `--scan-depth <n>` | Max directory depth to scan for `SKILL.md` (default: 6) |
| `--max-skills <n>` | Max discovered skills to export (default: 200) |
| `--json` | Output JSON |

**Examples:**
```bash
skild extract-github-skills https://github.com/ComposioHQ/awesome-claude-skills
```

---

### skild uninstall

Remove an installed Skill. Alias: `skild rm`

```bash
skild uninstall <skill> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform |
| `-l, --local` | Uninstall from project directory |
| `-f, --force` | Uninstall even if metadata is missing |
| `--with-deps` | Also uninstall Skillset dependencies |

---

### skild update

Update installed Skills. Alias: `skild up`

```bash
skild update [skill] [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform |
| `-l, --local` | Update project-level installations |
| `--json` | Output in JSON format |

---

### skild sync

Sync installed skills across platforms by auto-detecting missing installs and prompting with a tree (All → Platform → Skill).

```bash
skild sync [skills...] [--to <platforms>] [--all] [--local] [--yes] [--force] [--json]
```

**Examples:**
```bash
# Auto-detect missing skills and sync all (TTY shows selection tree)
skild sync

# Limit to specific platforms
skild sync pdf web-scraper --to codex,cursor
```

---

## Discovery Commands

### skild list

List installed Skills. Alias: `skild ls`

```bash
skild list [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform (omit to list all) |
| `-l, --local` | List project-level installations |
| `--paths` | Show installation paths |
| `--verbose` | Show Skillset dependency details |
| `--json` | Output in JSON format |

**Output Groups:**
- Skillsets
- Skills
- Dependencies (with "required by" info)

---

### skild info

Show details about an installed Skill.

```bash
skild info <skill> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform |
| `-l, --local` | Use project-level directory |
| `--json` | Output in JSON format |

---

### skild search

Search the Skild registry.

```bash
skild search <query> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--registry <url>` | Override registry URL |
| `--limit <n>` | Max results (default: 50) |
| `--json` | Output in JSON format |

---

### skild validate

Validate a Skill's structure. Alias: `skild v`

```bash
skild validate [path|skill] [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform (for installed skill lookup) |
| `-l, --local` | Use project-level directory |
| `--json` | Output in JSON format |

---

## Authoring Commands

### skild init

Create a new Skill project.

```bash
skild init <name> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--dir <path>` | Target directory (defaults to `<name>`) |
| `--description <text>` | Skill description |
| `-f, --force` | Overwrite if directory exists |

Creates a directory with a `SKILL.md` template.

---

### skild publish

Publish a Skill to the registry.

```bash
skild publish [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--dir <path>` | Skill directory (default: cwd) |
| `--name <@publisher/skill>` | Override skill name |
| `--skill-version <semver>` | Override version |
| `--alias <alias>` | Optional short identifier (global unique) for `skild install <alias>` |
| `--description <text>` | Override description |
| `--targets <list>` | Comma-separated target platforms |
| `--tag <tag>` | Dist-tag (default: latest) |
| `--registry <url>` | Override registry URL |
| `--json` | Output in JSON format |

**Example:**
```bash
skild publish --dir ./my-skill --alias my-skill
```

---

### skild push

Push a Skill directory into a Git repository (registry-free).

```bash
skild push [repo] [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--dir <path>` | Skill directory (default: cwd) |
| `--path <path>` | Target path inside repo (default: `skills/<skill-name>`) |
| `--branch <branch>` | Target branch (default: repo default) |
| `--message <text>` | Custom commit message |
| `--local` | Treat `<repo>` as a local path |

**Examples:**
```bash
# Set a default repo and omit <repo>
skild config set push.defaultRepo owner/repo
skild push --dir ./my-skill

# Explicit repo (overrides default)
skild push owner/repo --dir ./my-skill
```

Notes:
- For `owner/repo`, skild tries SSH first and falls back to HTTPS if SSH auth fails.

---

## Configuration Commands

### skild config

Manage global config values.

```bash
skild config get <key>
skild config set <key> <value>
skild config unset <key>
skild config list
```

**Keys:**
- `defaultPlatform`: claude, codex, copilot, antigravity, cursor, opencode, windsurf
- `defaultScope`: global, project
- `push.defaultRepo`: default repo for `skild push` when `<repo>` is omitted

---

## Authentication Commands

### skild signup

Create a publisher account.

```bash
skild signup [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--email <email>` | Email address |
| `--handle <handle>` | Publisher handle (owns @handle/* scope) |
| `--password <password>` | Password |
| `--registry <url>` | Override registry URL |
| `--json` | Output in JSON format |

---

### skild login

Login to the registry.

```bash
skild login [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--handle-or-email <value>` | Handle or email |
| `--password <password>` | Password |
| `--token-name <name>` | Token label |
| `--registry <url>` | Override registry URL |
| `--json` | Output in JSON format |

---

### skild whoami

Show current registry identity.

```bash
skild whoami
```

---

### skild logout

Remove stored credentials.

```bash
skild logout
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SKILD_REGISTRY_URL` | Override default registry URL |
| `SKILD_HOME` | Override skild home directory (~/.skild) |
| `SKILD_DEFAULT_PUSH_REPO` | Default repo for `skild push` when `<repo>` is omitted |

---

## Target Platforms

| Platform | Option | Global Path | Project Path |
|----------|--------|-------------|--------------|
| Claude | `-t claude` (default) | `~/.claude/skills` | `./.claude/skills` |
| Codex | `-t codex` | `~/.codex/skills` | `./.codex/skills` |
| Copilot | `-t copilot` | `~/.github/skills` | `./.github/skills` |
| Antigravity | `-t antigravity` | `~/.gemini/antigravity/skills` | `./.agent/skills` |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
