---
name: claude-dev-pack
description: Development pack (MCP/webapp testing/artifacts) + systematic debugging + review workflow.
version: 0.1.0
skillset: true
dependencies:
  # Anthropic official dev skills
  - https://github.com/anthropics/skills/tree/main/skills/mcp-builder
  - https://github.com/anthropics/skills/tree/main/skills/webapp-testing
  - https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder

  # Obra superpowers (developer workflow)
  - https://github.com/obra/superpowers/tree/main/skills/systematic-debugging
  - https://github.com/obra/superpowers/tree/main/skills/root-cause-tracing
  - https://github.com/obra/superpowers/tree/main/skills/test-driven-development

  # Sentry team dev skills
  - https://github.com/getsentry/skills/tree/main/plugins/sentry-skills/skills/code-review
  - https://github.com/getsentry/skills/tree/main/plugins/sentry-skills/skills/create-pr
  - https://github.com/getsentry/skills/tree/main/plugins/sentry-skills/skills/commit
  - https://github.com/getsentry/skills/tree/main/plugins/sentry-skills/skills/find-bugs
---

# claude-dev-pack

Curated Skillset based on `VoltAgent/awesome-claude-skills`.

