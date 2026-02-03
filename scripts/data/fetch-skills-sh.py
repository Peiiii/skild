#!/usr/bin/env python3
import argparse
import json
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

BASE_URL = "https://skills.sh"
TRENDING_URL = f"{BASE_URL}/trending"
GITHUB_REPO_API = "https://api.github.com/repos/{}"
DEFAULT_OUTPUT_DIR = Path("data/skills-sh")
PUBLIC_DATA_DIRS = [
    Path("apps/web/public/data"),
    Path("apps/console/public/data"),
]

CORE_DOMAINS = [
    {
        "id": "agent-workflow",
        "name": "Agent Discovery & Automation",
        "focus": "Skill discovery, browser control, and automation workflows that answer: what should I use next?",
        "skills": [
            {
                "source": "vercel-labs/skills",
                "skillId": "find-skills",
                "tags": ["discover", "search", "installation"],
            },
            {
                "source": "vercel-labs/agent-browser",
                "skillId": "agent-browser",
                "tags": ["browser", "automation", "web"],
            },
            {
                "source": "browser-use/browser-use",
                "skillId": "browser-use",
                "tags": ["browser", "workflow", "automation"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "skill-creator",
                "tags": ["skill-authoring", "workflow", "governance"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "mcp-builder",
                "tags": ["mcp", "integration", "tools"],
            },
            {
                "source": "obra/superpowers",
                "skillId": "subagent-driven-development",
                "tags": ["agents", "collaboration", "workflow"],
            },
        ],
    },
    {
        "id": "frontend-ui",
        "name": "Frontend & UI/UX",
        "focus": "Experience, performance, and maintainability across frontend frameworks and design systems.",
        "skills": [
            {
                "source": "vercel-labs/agent-skills",
                "skillId": "vercel-react-best-practices",
                "tags": ["react", "nextjs", "performance"],
            },
            {
                "source": "vercel-labs/agent-skills",
                "skillId": "web-design-guidelines",
                "tags": ["design", "ui", "ux"],
            },
            {
                "source": "remotion-dev/skills",
                "skillId": "remotion-best-practices",
                "tags": ["video", "react", "motion"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "frontend-design",
                "tags": ["frontend", "design", "usability"],
            },
            {
                "source": "vercel-labs/agent-skills",
                "skillId": "vercel-composition-patterns",
                "tags": ["component", "architecture", "patterns"],
            },
            {
                "source": "nextlevelbuilder/ui-ux-pro-max-skill",
                "skillId": "ui-ux-pro-max",
                "tags": ["ui", "ux", "design"],
            },
            {
                "source": "hyf0/vue-skills",
                "skillId": "vue-best-practices",
                "tags": ["vue", "frontend", "best-practices"],
            },
        ],
    },
    {
        "id": "mobile-native",
        "name": "Mobile & Native",
        "focus": "Mobile UX and native capabilities for React Native and Expo.",
        "skills": [
            {
                "source": "vercel-labs/agent-skills",
                "skillId": "vercel-react-native-skills",
                "tags": ["react-native", "mobile", "best-practices"],
            },
            {
                "source": "expo/skills",
                "skillId": "building-native-ui",
                "tags": ["expo", "mobile-ui", "native"],
            },
            {
                "source": "expo/skills",
                "skillId": "upgrading-expo",
                "tags": ["expo", "upgrade", "maintenance"],
            },
            {
                "source": "expo/skills",
                "skillId": "native-data-fetching",
                "tags": ["expo", "data", "networking"],
            },
            {
                "source": "expo/skills",
                "skillId": "expo-dev-client",
                "tags": ["expo", "devtools", "debugging"],
            },
            {
                "source": "callstackincubator/agent-skills",
                "skillId": "react-native-best-practices",
                "tags": ["react-native", "architecture", "performance"],
            },
        ],
    },
    {
        "id": "backend-data",
        "name": "Backend & Data",
        "focus": "Databases, auth, and API design to keep backend systems stable and scalable.",
        "skills": [
            {
                "source": "supabase/agent-skills",
                "skillId": "supabase-postgres-best-practices",
                "tags": ["postgres", "database", "supabase"],
            },
            {
                "source": "better-auth/skills",
                "skillId": "better-auth-best-practices",
                "tags": ["auth", "security", "backend"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "api-design-principles",
                "tags": ["api", "design", "backend"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "postgresql-table-design",
                "tags": ["postgres", "schema", "database"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "sql-optimization-patterns",
                "tags": ["sql", "performance", "database"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "openapi-spec-generation",
                "tags": ["openapi", "api", "documentation"],
            },
        ],
    },
    {
        "id": "devops-infra",
        "name": "DevOps & Infra",
        "focus": "Deployment pipelines and infrastructure automation for reliable delivery.",
        "skills": [
            {
                "source": "expo/skills",
                "skillId": "expo-deployment",
                "tags": ["deployment", "expo", "release"],
            },
            {
                "source": "expo/skills",
                "skillId": "expo-cicd-workflows",
                "tags": ["cicd", "automation", "expo"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "github-actions-templates",
                "tags": ["ci", "github-actions", "automation"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "deployment-pipeline-design",
                "tags": ["pipeline", "delivery", "devops"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "terraform-module-library",
                "tags": ["terraform", "infra", "iac"],
            },
            {
                "source": "sickn33/antigravity-awesome-skills",
                "skillId": "docker-expert",
                "tags": ["docker", "containers", "devops"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "k8s-manifest-generator",
                "tags": ["kubernetes", "infra", "automation"],
            },
        ],
    },
    {
        "id": "quality-testing",
        "name": "Quality & Testing",
        "focus": "Testing strategy, TDD, and quality guardrails to reduce regressions.",
        "skills": [
            {
                "source": "anthropics/skills",
                "skillId": "webapp-testing",
                "tags": ["testing", "qa", "web"],
            },
            {
                "source": "obra/superpowers",
                "skillId": "test-driven-development",
                "tags": ["tdd", "testing", "engineering"],
            },
            {
                "source": "obra/superpowers",
                "skillId": "systematic-debugging",
                "tags": ["debugging", "diagnosis", "quality"],
            },
            {
                "source": "softaworks/agent-toolkit",
                "skillId": "qa-test-planner",
                "tags": ["qa", "planning", "testing"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "python-testing-patterns",
                "tags": ["python", "testing", "patterns"],
            },
            {
                "source": "wshobson/agents",
                "skillId": "e2e-testing-patterns",
                "tags": ["e2e", "testing", "automation"],
            },
        ],
    },
    {
        "id": "growth-content",
        "name": "Growth & Marketing",
        "focus": "Growth, copywriting, and SEO to drive acquisition and conversion.",
        "skills": [
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "seo-audit",
                "tags": ["seo", "marketing", "growth"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "copywriting",
                "tags": ["copywriting", "content", "conversion"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "marketing-psychology",
                "tags": ["marketing", "psychology", "positioning"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "programmatic-seo",
                "tags": ["seo", "automation", "growth"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "marketing-ideas",
                "tags": ["ideation", "growth", "marketing"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "pricing-strategy",
                "tags": ["pricing", "strategy", "growth"],
            },
            {
                "source": "coreyhaines31/marketingskills",
                "skillId": "social-content",
                "tags": ["social", "content", "distribution"],
            },
        ],
    },
    {
        "id": "docs-office",
        "name": "Docs & Office",
        "focus": "Document and spreadsheet workflows for extraction and reporting.",
        "skills": [
            {
                "source": "anthropics/skills",
                "skillId": "pdf",
                "tags": ["pdf", "docs", "extraction"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "pptx",
                "tags": ["pptx", "slides", "docs"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "xlsx",
                "tags": ["xlsx", "spreadsheet", "data"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "docx",
                "tags": ["docx", "docs", "authoring"],
            },
            {
                "source": "anthropics/skills",
                "skillId": "doc-coauthoring",
                "tags": ["docs", "collaboration", "workflow"],
            },
            {
                "source": "onmax/nuxt-skills",
                "skillId": "document-writer",
                "tags": ["writing", "docs", "automation"],
            },
        ],
    },
]


def fetch_text(url):
    req = Request(url, headers={"User-Agent": "skild-data-collector/0.1"})
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def extract_array(html, key):
    start = html.find(key)
    if start == -1:
        raise RuntimeError(f"missing key: {key}")
    idx = html.find("[", start)
    if idx == -1:
        raise RuntimeError(f"missing array for key: {key}")
    depth = 0
    for i in range(idx, len(html)):
        ch = html[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return html[idx : i + 1]
    raise RuntimeError(f"unterminated array for key: {key}")


def parse_skills(html, key):
    raw = extract_array(html, key)
    decoded = raw.encode("utf-8").decode("unicode_escape")
    return json.loads(decoded)


def dedupe_skills(skills):
    deduped = {}
    for skill in skills:
        key = (skill["source"], skill["skillId"])
        existing = deduped.get(key)
        if existing is None or skill["installs"] > existing["installs"]:
            deduped[key] = skill
    return sorted(deduped.values(), key=lambda item: item["installs"], reverse=True)


def add_urls(skills):
    output = []
    for skill in skills:
        entry = dict(skill)
        entry["repo"] = skill["source"]
        entry["skillUrl"] = f"{BASE_URL}/{skill['source']}/{skill['skillId']}"
        entry["repoUrl"] = f"https://github.com/{skill['source']}"
        output.append(entry)
    return output


def load_star_cache(path):
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {
        "generatedAt": None,
        "repos": {},
    }


def fetch_repo_stars(repos, cache, sleep_seconds=0.8):
    for repo in sorted(repos):
        if repo in cache["repos"]:
            continue
        url = GITHUB_REPO_API.format(repo)
        try:
            payload = json.loads(fetch_text(url))
            cache["repos"][repo] = payload.get("stargazers_count")
        except Exception:
            cache["repos"][repo] = None
        time.sleep(sleep_seconds)
    cache["generatedAt"] = datetime.now(timezone.utc).isoformat()
    return cache


class SkillSummaryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_prose = False
        self.prose_depth = 0
        self.in_paragraph = False
        self.current_text = []
        self.paragraphs = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if (
            tag == "div"
            and not self.in_prose
            and "class" in attrs_dict
            and "prose" in attrs_dict["class"]
        ):
            self.in_prose = True
            self.prose_depth = 1
            return
        if self.in_prose:
            self.prose_depth += 1
            if tag == "p":
                self.in_paragraph = True
                self.current_text = []

    def handle_endtag(self, tag):
        if not self.in_prose:
            return
        if tag == "p" and self.in_paragraph:
            text = " ".join("".join(self.current_text).split())
            if text:
                self.paragraphs.append(text)
            self.in_paragraph = False
            self.current_text = []
        self.prose_depth -= 1
        if self.prose_depth == 0:
            self.in_prose = False

    def handle_data(self, data):
        if self.in_prose and self.in_paragraph:
            self.current_text.append(data)


def load_summary_cache(path):
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {
        "generatedAt": None,
        "summaries": {},
    }


def fetch_skill_summary(skill_url):
    try:
        html = fetch_text(skill_url)
    except Exception:
        return None
    parser = SkillSummaryParser()
    parser.feed(html)
    return parser.paragraphs[0] if parser.paragraphs else None


def get_skill_summary(skill_key, skill_url, cache, refresh=False, sleep_seconds=0.3):
    cached = cache["summaries"].get(skill_key)
    if cached and cached.get("summary") and not refresh:
        return cached["summary"]
    summary = fetch_skill_summary(skill_url)
    cache["summaries"][skill_key] = {
        "summary": summary,
        "skillUrl": skill_url,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }
    time.sleep(sleep_seconds)
    return summary


def build_core_domains(
    all_time_map,
    trending_map,
    star_cache,
    summary_cache,
    skip_summaries=False,
    refresh_summaries=False,
    summary_sleep_seconds=0.3,
):
    domains = []
    for domain in CORE_DOMAINS:
        skills = []
        for item in domain["skills"]:
            key = (item["source"], item["skillId"])
            all_time = all_time_map.get(key)
            trending = trending_map.get(key)
            skill_key = f"{item['source']}/{item['skillId']}"
            skill_url = f"{BASE_URL}/{item['source']}/{item['skillId']}"
            summary = None
            summary_source = None
            if not skip_summaries:
                summary = get_skill_summary(
                    skill_key,
                    skill_url,
                    summary_cache,
                    refresh=refresh_summaries,
                    sleep_seconds=summary_sleep_seconds,
                )
                if summary:
                    summary_source = "skills.sh"
            if not summary:
                summary = "SKILL.md summary unavailable"
                summary_source = "fallback"
            entry = {
                "source": item["source"],
                "skillId": item["skillId"],
                "name": all_time.get("name") if all_time else item["skillId"],
                "installsAllTime": all_time.get("installs") if all_time else None,
                "installsTrending": trending.get("installs") if trending else None,
                "skillUrl": skill_url,
                "repoUrl": f"https://github.com/{item['source']}",
                "repoStars": star_cache["repos"].get(item["source"]),
                "tags": item["tags"],
                "summary": summary,
                "summarySource": summary_source,
            }
            skills.append(entry)
        domains.append(
            {
                "id": domain["id"],
                "name": domain["name"],
                "focus": domain["focus"],
                "skills": skills,
            }
        )
    return domains


def render_markdown(core_data):
    lines = []
    lines.append("# Skills.sh Core Domains (SKILL.md Summary Edition)")
    lines.append("")
    lines.append(f"Data source: {TRENDING_URL}")
    lines.append(f"Generated at: {core_data['generatedAt']}")
    lines.append("")
    lines.append("Notes:")
    lines.append("- Stars come from the GitHub API; `null` indicates fetch failure or rate limiting.")
    lines.append("- Summaries come from the first SKILL.md paragraph on skills.sh; failures show as \"SKILL.md summary unavailable\".")
    lines.append("- Domains and tags are curated and will evolve with user feedback.")
    lines.append("")
    lines.append("Full datasets:")
    lines.append("- `data/skills-sh/skills-all-time.json`")
    lines.append("- `data/skills-sh/skills-trending.json`")
    lines.append("")

    for domain in core_data["domains"]:
        lines.append(f"## {domain['name']}")
        lines.append("")
        lines.append(domain["focus"])
        lines.append("")
        lines.append("| Skill | Repo | Installs (all-time) | Installs (24h) | Stars | Tags | Summary |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- |")
        for skill in domain["skills"]:
            tags = ", ".join(skill["tags"])
            installs_all = skill["installsAllTime"] or "-"
            installs_trending = skill["installsTrending"] or "-"
            stars = skill["repoStars"] if skill["repoStars"] is not None else "-"
            skill_link = f"[{skill['name']}]({skill['skillUrl']})"
            repo_link = f"[{skill['source']}]({skill['repoUrl']})"
            summary = skill["summary"].replace("|", "\\|")
            lines.append(
                f"| {skill_link} | {repo_link} | {installs_all} | {installs_trending} | {stars} | {tags} | {summary} |"
            )
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Fetch skills data from skills.sh")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Output directory")
    parser.add_argument("--skip-stars", action="store_true", help="Skip GitHub stars fetch")
    parser.add_argument("--skip-summaries", action="store_true", help="Skip SKILL.md summary fetch")
    parser.add_argument(
        "--refresh-summaries",
        action="store_true",
        help="Refresh cached SKILL.md summaries",
    )
    parser.add_argument(
        "--summary-sleep",
        type=float,
        default=0.3,
        help="Delay between summary fetches (seconds)",
    )
    parser.add_argument(
        "--skip-public",
        action="store_true",
        help="Skip writing public JSON for the web/console apps",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    html = fetch_text(TRENDING_URL)
    all_time = dedupe_skills(parse_skills(html, "allTimeSkills"))
    trending = dedupe_skills(parse_skills(html, "trendingSkills"))

    all_time_with_urls = add_urls(all_time)
    trending_with_urls = add_urls(trending)

    all_time_map = {(s["source"], s["skillId"]): s for s in all_time}
    trending_map = {(s["source"], s["skillId"]): s for s in trending}

    star_cache_path = output_dir / "repo-stars.json"
    star_cache = load_star_cache(star_cache_path)
    summary_cache_path = output_dir / "skills-core-summaries.json"
    summary_cache = load_summary_cache(summary_cache_path)

    if not args.skip_stars:
        repos = {item["source"] for domain in CORE_DOMAINS for item in domain["skills"]}
        star_cache = fetch_repo_stars(repos, star_cache)
        with star_cache_path.open("w", encoding="utf-8") as handle:
            json.dump(star_cache, handle, ensure_ascii=True, indent=2)

    core_domains = build_core_domains(
        all_time_map,
        trending_map,
        star_cache,
        summary_cache,
        skip_summaries=args.skip_summaries,
        refresh_summaries=args.refresh_summaries,
        summary_sleep_seconds=args.summary_sleep,
    )

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": TRENDING_URL,
        "domains": core_domains,
    }

    with (output_dir / "skills-all-time.json").open("w", encoding="utf-8") as handle:
        json.dump(all_time_with_urls, handle, ensure_ascii=True, indent=2)

    with (output_dir / "skills-trending.json").open("w", encoding="utf-8") as handle:
        json.dump(trending_with_urls, handle, ensure_ascii=True, indent=2)

    with (output_dir / "skills-core-domains.json").open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2)

    with summary_cache_path.open("w", encoding="utf-8") as handle:
        summary_cache["generatedAt"] = datetime.now(timezone.utc).isoformat()
        json.dump(summary_cache, handle, ensure_ascii=True, indent=2)

    if not args.skip_public:
        for public_dir in PUBLIC_DATA_DIRS:
            public_dir.mkdir(parents=True, exist_ok=True)
            with (public_dir / "skills-core-domains.json").open(
                "w", encoding="utf-8"
            ) as handle:
                json.dump(payload, handle, ensure_ascii=True, indent=2)

    markdown = render_markdown(payload)
    with (output_dir / "skills-core-domains.md").open("w", encoding="utf-8") as handle:
        handle.write(markdown)


if __name__ == "__main__":
    main()
