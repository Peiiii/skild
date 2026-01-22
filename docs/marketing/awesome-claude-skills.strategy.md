# Strategy: Turn “Awesome Claude Skills” into Skild Growth Flywheel

Resources

- Official Claude Skills: https://github.com/anthropics/skills
- Curated list (market-validated): https://github.com/VoltAgent/awesome-claude-skills

Goal

Make skills “installable + shareable + repeatable” via Skild, focusing on the highest-leverage distribution primitive:

- One short alias → one complete toolkit (skillset) → immediate value

Principles

- Zero invasion: do not modify upstream `SKILL.md`; depend on upstream GitHub directories only.
- Quality first: curated packs should install cleanly (has `SKILL.md` + valid frontmatter whenever possible).
- Stable identifiers: prefer degit shorthand; only add `#ref` for non-default branches (default branch omits `#ref`).
- Marketing-first UX: every pack has a memorable alias and a single-line install command.
- Maintenance-friendly: keep packs small and purposeful (avoid “dump everything” unless it is explicitly the point).

What we build (v1)

We ship 5–6 “Featured Skillsets” that map to real jobs:

1) `anthropics-official-pack` (alias: `anthropics-skills`)
   - The canonical baseline: all official skills from `anthropics/skills`

2) `claude-office-pack` (alias: `claude-office`)
   - Documents + internal comms (docx/pptx/xlsx/pdf + comms)

3) `claude-design-pack` (alias: `claude-design`)
   - UI/UX + artifacts styling (frontend design, themes, brand)

4) `claude-dev-pack` (alias: `claude-dev`)
   - Dev/testing toolkit (official dev skills + a few high-signal community dev skills)

5) `claude-content-pack` (alias: `claude-content`)
   - Research + writing acceleration (ComposioHQ pack + NotebookLM + Deep Research)

6) `obra-superpowers-pack` (alias: `superpowers`)
   - Popular “meta” skillset (planning, code review, debugging, verification, etc.)

How we use awesome-claude-skills

- Treat it as an “upstream source of truth” for discovery + credibility.
- Convert individual items into Skild skill dependencies (GitHub directory refs).
- Convert categories into installable packs (skillsets).
- Keep a “Featured Skillsets” section on the website + Hub that links to these packs.

Release & verification checklist (closed loop)

Code/content changes:

- Build/lint/typecheck: `pnpm release:check`
- Smoke (local):
  - `SKILD_HOME=$(mktemp -d) pnpm -s cli install ./skillsets/<pack> --json`
- Publish (registry):
  - `pnpm -s cli publish --dir ./skillsets/<pack> --alias <alias> --json`
- Online smoke:
  - `curl https://registry.skild.sh/resolve?alias=<alias>`
  - `SKILD_HOME=$(mktemp -d) npx -y skild@latest install <alias> --json`
- Deploy pages (marketing surface):
  - `pnpm deploy:pages`
  - Verify:
    - `curl -fsS https://skild.sh | head`
    - Visit `https://hub.skild.sh/skillsets` and check featured packs are visible

Next iteration ideas

- Automate validation: CI job that materializes each dependency and fails on missing `SKILL.md`.
- Add “curation metadata” per pack (tags, target platforms, maintainer, last verified).
- Add “Featured Skillsets” JSON manifest served by registry for the website/hub to render dynamically.
