# 2026-02-03 Hub Skill Data

## 背景 / 问题

- Hub 缺少可被用户直接理解与使用的“核心技能清单”，导致价值感不足
- 需要先落地可信的技能数据与可读的领域分类，作为后续产品聚焦依据

## 决策

- 先落地 skills.sh 的全量技能数据与可复用的抓取脚本
- 以 8 个核心领域做“首批精选清单”，提供标签与说明，并补充 GitHub Stars

## 变更内容

- 新增 skills.sh 数据抓取脚本：`scripts/data/fetch-skills-sh.py`
- 落盘全量技能数据：`data/skills-sh/skills-all-time.json`
- 落盘 24h trending 数据：`data/skills-sh/skills-trending.json`
- 落盘核心领域精选：`data/skills-sh/skills-core-domains.json`
- 输出核心领域文档：`data/skills-sh/skills-core-domains.md`
- 缓存 GitHub Stars：`data/skills-sh/repo-stars.json`

## 功能说明

- **目标**：为 Hub 提供全量技能数据与“核心领域”精选清单，作为后续产品与内容建设的基础。
- **输入**：访问 `https://skills.sh/trending` 页面，解析 all-time 与 trending 数据。
- **输出**：JSON 数据集 + 核心领域 Markdown 清单 + repo stars 缓存。
- **默认策略与边界**：
  - 对重复 skill 以更高 installs 的记录为准。
  - GitHub Stars 通过 API 获取，若失败则记录为 `null`。
  - 精选领域与标签为人工版本，可持续迭代。

## 使用方式

```bash
# 示例 1：生成数据（默认输出到 data/skills-sh）
python3 scripts/data/fetch-skills-sh.py

# 示例 2：输出到临时目录（用于验证/对比）
python3 scripts/data/fetch-skills-sh.py --output-dir /tmp/skills-sh
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# smoke-check（非仓库目录）
tmpdir=$(mktemp -d) && python3 /Users/peiwang/Projects/skild/scripts/data/fetch-skills-sh.py --output-dir "$tmpdir/skills-sh" --skip-stars && test -s "$tmpdir/skills-sh/skills-all-time.json" && test -s "$tmpdir/skills-sh/skills-core-domains.md" && rm -rf "$tmpdir"
```

验收点：

- `skills-all-time.json` 与 `skills-trending.json` 能生成且非空
- `skills-core-domains.md` 生成且含 8 个领域表格

## 发布 / 部署

- 无（数据与文档变更）

## 影响范围 / 风险

- Breaking change? 否
- 风险：GitHub API 限流导致 stars 为空，需要后续补全
- 回滚方式：删除 `data/skills-sh` 与脚本文件
