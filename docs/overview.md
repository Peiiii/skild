# Skild Product Overview (fast-share version)

> For developers and AI builders who want the TL;DR: what Skild is, why it matters, and how to use it in minutes.

## One-line pitch

Skild is the package manager for Agent Skills—like npm or Homebrew, but for discovering, installing, managing, and publishing AI agent skills.

## Why Skild?

- Installing skills by cloning repos is messy; no consistent standard or versioning  
- Multiple platforms (Claude, Codex, Copilot, Antigravity, Agents) stay siloed; hard to keep in sync  
- No marketplace: hard to find trusted skills, ratings, or reliable updates  
- Skill authors must roll their own validation, versioning, distribution, and promotion

Skild handles the plumbing so skills feel as easy as installing plugins.

## Core value props

- **One-command install**: `skild install <source>` supports GitHub, registry, and local paths  
- **Cross-platform sync**: `skild sync` auto-detects missing installs and fills the gaps  
- **Standards + validation**: `skild validate` enforces structure and reduces breakage  
- **Skillsets**: install curated bundles in one go (great for teams)  
- **Publish loop**: `skild publish` for registry, `skild extract-github-skills` for bulk imports  
- **Hub marketplace**: hub.skild.sh to browse and install featured skills

## Typical scenarios

- **Personal productivity**: add pdf/xlsx/web scraping/data analysis skills to your agent  
- **Team alignment**: ship a Skillset so everyone installs the same toolkit across platforms  
- **Skill authors**: scaffold with `skild init`, self-check with `validate`, then publish  
- **Enterprise governance**: lock versions, control sources, and keep installs reproducible

## 3-minute quickstart

```bash
# 1) Install the Skild CLI
npm i -g skild

# 2) Install a Skillset (example: anthropics/skills — GitHub <username>/<repo>, installs a popular pack)
skild install anthropics/skills

# 3) List what's installed
skild list

# 4) Cross-platform sync (default all platforms; optionally target specific ones)
skild sync
# skild sync --to codex,cursor
```

More examples live in `README.md` and `docs/getting-started.md`.

## Feature snapshot

| Category | What it does | Commands |
| --- | --- | --- |
| Install & manage | Install, uninstall, update, list, inspect | `install / uninstall / update / list / info` |
| Search & discover | Search skills | `search` |
| Build & publish | Scaffold, validate, publish | `init / validate / publish` |
| Cross-platform | Sync installs across platforms | `sync` (optional `--to codex,cursor`) |
| Skillsets | Bundle install & cleanup | `install <skillset> / uninstall --with-deps` (see docs/skillsets.md) |

## Advanced capabilities

- **Registry account + publish**: `skild signup`, `login`, `publish`  
- **Bulk GitHub ingestion**: `skild extract-github-skills <source>`  
- **Web Hub**: hub.skild.sh for browsing, installs, and ratings (evolving)

## Ecosystem & roadmap (short)

- MVP done: install/validate/list/cross-platform sync/scaffolding  
- Registry + Hub evolving: search, ratings, comments, private skills  
- Coming up: richer Skillset templates, team policies (allow/deny lists), security scanning

## Who should use it

- Developers and makers upgrading their agents with more capabilities  
- Engineering teams standardizing an agent skill stack  
- Skill authors/companies publishing curated toolkits  
- Enterprises that need source/version control for agent skills

## How to engage

- Try & star: GitHub `peiiii/skild`, npm `skild`  
- Contribute: PRs, new skills, docs improvements  
- Feedback: GitHub Issues or community threads

## Links

- Website: skild.sh  
- Hub: hub.skild.sh  
- Repo: github.com/Peiiii/skild  
- Docs index: `docs/README.md`
