# skild

## 0.10.2

### Patch Changes

- improve list display
- Updated dependencies
  - @skild/core@0.10.2

## 0.10.1

### Patch Changes

- optimize list display
- Updated dependencies
  - @skild/core@0.10.1

## 0.10.0

### Minor Changes

- Add npm-style `skild add` alias for installs (same behavior as `skild install` / `skild i`).

## 0.9.1

### Patch Changes

- Improve `skild sync` UX: English logs, per-platform missing counts, and clearer “nothing to sync” messaging.

## 0.9.0

### Minor Changes

- Enhance `skild sync` to auto-detect missing installs across all platforms, show a tree selector (All → Platform → Skill), and sync using the best available source (registry or local copy).

## 0.8.0

### Minor Changes

- Add `skild sync` command to synchronize installed skills across platforms.

## 0.7.0

### Minor Changes

- c528ff7: - decouple markdown recursion depth from skill directory scan depth via --scan-depth
  - expand multi-skill repo links into a path-based tree and collapse single-child levels
  - extract skill metadata for markdown discovery and show descriptions in the selection tree

### Patch Changes

- Updated dependencies [c528ff7]
  - @skild/core@0.7.0

## 0.6.1

### Patch Changes

- allow depth 0 and default depth to 0 for install discovery

## 0.6.0

### Minor Changes

- add markdown-based recursive skill discovery for GitHub sources

## 0.5.3

### Patch Changes

- filter interactive platform selection to show only locally installed platforms when available

## 0.5.2

### Patch Changes

- normalize registry alias specs by stripping accidental wrapping quotes
- Updated dependencies
  - @skild/core@0.5.2

## 0.5.1

### Patch Changes

- fallback to default branch when ref is missing during remote materialization
- hide branch/commit refs in alias resolution output
- Updated dependencies
  - @skild/core@0.5.1

## 0.5.0

### Minor Changes

- - add Cursor/Windsurf platform support (paths, discovery, CLI prompts) and update docs
  ***

### Patch Changes

- Updated dependencies
  - @skild/core@0.5.0

## 0.4.7

### Patch Changes

- support opencode
- Updated dependencies
  - @skild/core@0.4.7

## 0.4.6

### Patch Changes

- improve tui
- Updated dependencies
  - @skild/core@0.4.6

## 0.4.5

### Patch Changes

- improve tui
- Updated dependencies
  - @skild/core@0.4.5

## 0.4.4

### Patch Changes

- fix skill and platform selection
- Updated dependencies
  - @skild/core@0.4.4

## 0.4.3

### Patch Changes

- improve skill selection
- Updated dependencies
  - @skild/core@0.4.3

## 0.4.2

### Patch Changes

- Fix interactive multi-skill install UX by pausing the spinner before printing the discovered skills list and prompting for confirmation, so the prompt is visible and not overwritten.
- Updated dependencies
  - @skild/core@0.4.2

## 0.4.1

### Patch Changes

- Fix `skild install --recursive` for GitHub URL sources by deriving valid child specs (degit shorthand) so multi-skill installs and `--json` suggestions work correctly.
- Updated dependencies
  - @skild/core@0.4.1

## 0.4.0

### Minor Changes

- Add `skild install --recursive` (and `-y/--yes`) to detect and install multiple sub-skills from a directory/repo without a root `SKILL.md`, with structured `--json` output for discovery and results.

### Patch Changes

- Updated dependencies
  - @skild/core@0.4.0

## 0.3.2

### Patch Changes

- Ensure `skild install` sets a non-zero exit code (and prints an error message) when installation fails.

## 0.3.1

### Patch Changes

- Ensure `skild install --json` outputs JSON only (no spinners/log lines), including `--all` installs.

## 0.3.0

### Minor Changes

- Add `skild install --all` to install a skill across all supported platforms.

## 0.2.9

### Patch Changes

- Support `skild publish --alias <alias>` and centralize alias validation in core.
- Updated dependencies
  - @skild/core@0.2.9

## 0.2.8

### Patch Changes

- Add Antigravity (`-t antigravity`) platform paths and improve `skild list` readability by grouping Skillsets/Skills/Dependencies with optional `--paths` and `--verbose`.
- Updated dependencies
  - @skild/core@0.2.8

## 0.2.7

### Patch Changes

- Support installing by `alias` (short identifier) via registry `/resolve`, so `skild install superpowers` resolves to the correct registry skill/linked source.
- Updated dependencies
  - @skild/core@0.2.7

## 0.2.6

### Patch Changes

- Fix password prompt rendering during interactive `skild login` / `skild signup` when editing input (e.g. backspace) by switching to a raw-mode password prompt.
- Updated dependencies
  - @skild/core@0.2.6

## 0.2.5

### Patch Changes

- Fix interactive `skild login` password prompt so the “Password:” label stays visible while input remains hidden.
- Updated dependencies
  - @skild/core@0.2.5

## 0.2.4

### Patch Changes

- Fix registry resolution during installs by defaulting to the logged-in registry URL, and add `SKILD_HOME` to isolate Skild state for testing/smoke runs.
- Updated dependencies
  - @skild/core@0.2.4

## 0.2.3

### Patch Changes

- Add skillset dependencies support (install/metadata/CLI list and uninstall).
- Updated dependencies
  - @skild/core@0.2.3

## 0.2.2

### Patch Changes

- Update CLI messaging to point to Skild Hub verification URLs.

## 0.2.1

### Patch Changes

- Report downloads from CLI installs.
- Updated dependencies
  - @skild/core@0.2.1

## 0.2.0

### Minor Changes

- cli with stats tracking

### Patch Changes

- Updated dependencies
  - @skild/core@0.2.0

## 0.1.4

### Patch Changes

- Ship registry commands (`login/signup/logout/whoami/publish/search`) in the published CLI package; add `prepack`/`prepublishOnly` builds to prevent stale `dist/` on publish.
- Updated dependencies
  - @skild/core@0.1.4

## 0.1.3

### Patch Changes

- Improve `skild list` UX: default lists all platforms, hide hidden skill folders, and make output styling consistent; also reduce dev command noise.
- Updated dependencies
  - @skild/core@0.1.3

## 0.1.2

### Patch Changes

- list for all
- Updated dependencies
  - @skild/core@0.1.2

## 0.1.1

### Patch Changes

- test
- Updated dependencies
  - @skild/core@0.1.1
