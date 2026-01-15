# @skild/core

## 0.4.7

### Patch Changes

- support opencode

## 0.4.6

### Patch Changes

- improve tui

## 0.4.5

### Patch Changes

- improve tui

## 0.4.4

### Patch Changes

- fix skill and platform selection

## 0.4.3

### Patch Changes

- improve skill selection

## 0.4.2

### Patch Changes

- Fix interactive multi-skill install UX by pausing the spinner before printing the discovered skills list and prompting for confirmation, so the prompt is visible and not overwritten.

## 0.4.1

### Patch Changes

- Fix `skild install --recursive` for GitHub URL sources by deriving valid child specs (degit shorthand) so multi-skill installs and `--json` suggestions work correctly.

## 0.4.0

### Patch Changes

- Add `skild install --recursive` (and `-y/--yes`) to detect and install multiple sub-skills from a directory/repo without a root `SKILL.md`, with structured `--json` output for discovery and results.

## 0.2.9

### Patch Changes

- Support `skild publish --alias <alias>` and centralize alias validation in core.

## 0.2.8

### Patch Changes

- Add Antigravity (`-t antigravity`) platform paths and improve `skild list` readability by grouping Skillsets/Skills/Dependencies with optional `--paths` and `--verbose`.

## 0.2.7

### Patch Changes

- Support installing by `alias` (short identifier) via registry `/resolve`, so `skild install superpowers` resolves to the correct registry skill/linked source.

## 0.2.6

### Patch Changes

- Fix password prompt rendering during interactive `skild login` / `skild signup` when editing input (e.g. backspace) by switching to a raw-mode password prompt.

## 0.2.5

### Patch Changes

- Fix interactive `skild login` password prompt so the “Password:” label stays visible while input remains hidden.

## 0.2.4

### Patch Changes

- Fix registry resolution during installs by defaulting to the logged-in registry URL, and add `SKILD_HOME` to isolate Skild state for testing/smoke runs.

## 0.2.3

### Patch Changes

- Add skillset dependencies support (install/metadata/CLI list and uninstall).

## 0.2.1

### Patch Changes

- Report downloads from CLI installs.

## 0.2.0

### Minor Changes

- cli with stats tracking

## 0.1.4

### Patch Changes

- Ship registry commands (`login/signup/logout/whoami/publish/search`) in the published CLI package; add `prepack`/`prepublishOnly` builds to prevent stale `dist/` on publish.

## 0.1.3

### Patch Changes

- Improve `skild list` UX: default lists all platforms, hide hidden skill folders, and make output styling consistent; also reduce dev command noise.

## 0.1.2

### Patch Changes

- list for all

## 0.1.1

### Patch Changes

- test
