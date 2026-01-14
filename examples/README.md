## Examples

- `examples/hello-skill`: a minimal Skill folder you can install with `skild install ./examples/hello-skill`.
- `examples/hello-skillset`: an example Skillset with inline dependencies you can install with `skild install ./examples/hello-skillset`.
- `examples/kitchen-sink-skillset`: a Skillset that includes inline + GitHub + registry dependencies (see `scripts/dev/skillset-kitchen-sink-smoke.mjs` for a full smoke run).
- `examples/registry-dep-skill`: a minimal Skill meant to be published to a local dev registry as a dependency for `examples/kitchen-sink-skillset`.
