# Submit Skills from GitHub

Found a great Skill on GitHub? Submit it to Skild so others can discover and install it easily.

---

## What is this?

You can submit any GitHub repository that contains a valid `SKILL.md` file to the Skild catalog. This makes it discoverable through the Skild Console and provides a simple install command.

---

## How to Submit

### 1. Create an account

Go to [console.skild.sh](https://console.skild.sh) and sign up.

### 2. Go to Submit page

Click **Submit Skills from GitHub** in the navigation.

### 3. Paste the GitHub URL

Enter the URL to the Skill. Supported formats:

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/main
https://github.com/owner/repo/tree/main/path/to/skill
https://github.com/owner/repo/tree/v1.0.0/path/to/skill
```

### 4. Parse and Submit

Click **Parse** to extract repository details, then click **Submit**.

---

## URL Tips

- The URL should point to a folder containing `SKILL.md`
- You can use specific branches or tags (e.g., `tree/v1.0.0`)
- For monorepos, include the path to the Skill folder

---

## After Submission

Once submitted, the Skill will be:

- **Discoverable** — Appears in the Skild Console search
- **Installable** — Users can install directly from GitHub:

```bash
skild install owner/repo/path/to/skill
```

---

## For Skill Authors

If you authored the Skill and want more control, consider [publishing it to the registry](./publishing-skills.md) instead. Published Skills get:

- Semantic versioning
- Download statistics
- Official publisher verification
