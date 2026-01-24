# skild

## 0.10.22

### Patch Changes

- Make install records portable by omitting machine-specific install paths.
- Updated dependencies
  - @skild/core@0.10.22

## 0.10.21

### Patch Changes

- Show all platforms in install prompt and default-select installed ones.

## 0.10.20

### Patch Changes

- Improve install output for single-skill multi-platform installs.

## 0.10.19

### Patch Changes

- Add `--skill` to target a specific skill from multi-skill sources.
- Updated dependencies
  - @skild/core@0.10.19

## 0.10.18

### Patch Changes

- Use the unified discover index for CLI search results.
- Updated dependencies
  - @skild/core@0.10.18

## 0.10.17

### Patch Changes

- Improve GitHub install reliability by preferring git clone with tarball fallback.
- Updated dependencies
  - @skild/core@0.10.17

## 0.10.16

### Patch Changes

- Refactor the interactive tree prompt into a reusable UI module, improve long-list navigation (no wrap-around), and add a small UI selfcheck.
- Updated dependencies
  - @skild/core@0.10.16

## 0.10.15

### Patch Changes

- Fix interactive prompt flicker and missing output by deferring selection logs until the UI exits and explicitly flushing queued logs before starting installs.

## 0.10.14

### Patch Changes

- Improve interactive tree selection UX: show precise Space hints for leaf vs folder nodes and adaptively truncate description/hint before truncating the name, keeping long paths readable without wrapping.

## 0.10.13

### Patch Changes

- Add per-line “(Space to toggle)” hint on focused items and make group nodes always flip all descendants (partial → all → none), keeping tree selection predictable even with long paths.

## 0.10.12

### Patch Changes

- Trim tree selection lines to terminal width: keep folder-style tree, move hints to footer, truncate long names instead of dropping descriptions so controls stay visible without wrapping.

## 0.10.11

### Patch Changes

- Trim tree selection lines to terminal width (drop per-line hints, truncate long names/suffixes) so long skill paths don’t wrap; keeps folder-style tree with toggle-all nodes.

## 0.10.10

### Patch Changes

- Restore tree-style skill selection (folder-like nodes with toggle all/none) using improved viewport scrolling to avoid duplication/jumping on long lists; removes flat inquirer list regression.

## 0.10.9

### Patch Changes

- Restore tree-structured skill selection using inquirer with indented choices (paged) so nested paths remain visible while avoiding flicker/duplication on long lists.

## 0.10.8

### Patch Changes

- Switch install candidate selection to inquirer checkboxes (with paging) to eliminate flicker/duplication on long lists and keep focus behavior stable.

## 0.10.7

### Patch Changes

- Render interactive selection in an alternate screen buffer (1049h/l) to avoid flicker and duplicated lines when scrolling long lists; main terminal content is preserved on exit.

## 0.10.6

### Patch Changes

- Fix interactive install selection rendering for long lists by clearing the full screen before redraw, preventing duplicated lines when scrolling.

## 0.10.5

### Patch Changes

- Improve remote skill discovery priority: always scan entire repo for any directory containing `SKILL.md` (not just known `skills/` folders) and then fall back to README parsing, so multi-skill repos without standard paths are detected first.

## 0.10.4

### Patch Changes

- Disable download stats reporting by default during `skild install` to avoid post-install delays; keep opt-in via `SKILD_ENABLE_STATS`/`SKILD_ENABLE_DOWNLOAD_STATS`/`SKILD_ENABLE_TELEMETRY`.

## 0.10.3

### Patch Changes

- improve start page
- Updated dependencies
  - @skild/core@0.10.3

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
