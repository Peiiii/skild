---
"@skild/core": patch
"skild": patch
---

Upgrade simple-git to 4.0.2 (fixes GHSA advisories in simple-git <4.0.1 and @simple-git/argv-parser <2.0.1) and import its named `simpleGit` export, since v4 removed the default export.
