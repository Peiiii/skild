# 2026-02-03 Hub Skill Summaries

## 迭代完成说明

- 核心领域精选扩展到每个领域 5-10 个技能（共 51 个）。
- 引入 skills.sh 页面渲染的 SKILL.md 首段作为摘要，并落盘缓存。
- 增加摘要缓存与可控刷新参数，便于后续维护。

## 功能说明

- **目标**：为 Hub 提供更完整的领域精选清单，并用真实 SKILL.md 内容作为摘要。
- **输入**：访问 `https://skills.sh/trending` 并抓取每个精选技能的详情页。
- **输出**：更新后的核心领域清单与摘要缓存文件。
- **默认策略与边界**：
  - 摘要取 SKILL.md 的首段；解析失败则标记为“SKILL.md 摘要获取失败”。
  - SKILL.md 摘要缓存可复用，必要时通过参数刷新。

## 使用方式

```bash
# 示例 1：生成数据并刷新摘要缓存
python3 scripts/data/fetch-skills-sh.py --refresh-summaries

# 示例 2：跳过 GitHub stars，仅生成摘要与数据
python3 scripts/data/fetch-skills-sh.py --skip-stars
```

## 测试/验证/验收方式

```bash
pnpm build
pnpm lint
pnpm typecheck

# smoke-check（非仓库目录）
tmpdir=$(mktemp -d) && python3 /Users/peiwang/Projects/skild/scripts/data/fetch-skills-sh.py --output-dir "$tmpdir/skills-sh" --skip-stars --refresh-summaries && rg -n "This skill helps you discover and install skills" "$tmpdir/skills-sh/skills-core-domains.md" && rm -rf "$tmpdir"
```

验收点：

- `skills-core-domains.md` 每个领域包含 5-10 个技能条目
- 摘要来自 SKILL.md，能在输出中找到真实段落内容

## 发布/部署方式

- 无（数据与文档变更）

## 影响范围 / 风险

- Breaking change? 否
- 风险：skills.sh 或 GitHub API 限流导致摘要或 stars 缺失
- 回滚方式：恢复 `scripts/data/fetch-skills-sh.py` 与 `data/skills-sh` 目录
