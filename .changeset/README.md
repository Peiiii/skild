# Changesets

This repo uses Changesets for versioning and publishing the workspace packages.

Typical flow:

1. Add a changeset in `.changeset/*.md` (one per logical change).
2. Run `pnpm release:version` to bump versions and update changelogs.
3. Commit the changes, then run `pnpm release` to publish.

