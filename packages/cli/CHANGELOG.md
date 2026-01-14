# skild

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
