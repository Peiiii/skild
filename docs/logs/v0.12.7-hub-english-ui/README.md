# 2026-02-04 Hub Core Domains English UI

## 背景 / 问题

- Hub 前端展示包含中文领域名称与说明，界面语言不一致
- 需要让核心领域数据与前端文案保持英文统一

## 决策

- 将核心领域名称、聚焦说明与数据文档统一为英文
- 前端继续消费同域 JSON，无需改动 UI 结构

## 变更内容

- 更新核心领域英文文案与默认 fallback 文案
- 重新生成核心领域 JSON 与 Markdown 数据

## 功能说明

- **目标**：Hub Core Domains 前端保持英文一致性
- **输入**：访问 `/core` 时加载 `/data/skills-core-domains.json`
- **输出**：英文领域标题与描述、英文 fallback 提示
- **默认策略与边界**：
  - 若摘要抓取失败展示英文 fallback
  - 领域文案在数据脚本中维护

## 使用方式

```bash
# 示例 1：生成英文数据
python3 scripts/data/fetch-skills-sh.py --skip-stars

# 示例 2：查看 Console 数据源
curl -fsS https://hub.skild.sh/data/skills-core-domains.json | head -n 5
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# smoke-check（非仓库目录）
tmpdir=$(mktemp -d) \
  && cp -R /Users/peiwang/Projects/skild/apps/console/dist "$tmpdir/dist" \
  && python3 -m http.server --directory "$tmpdir/dist" 8182 >/dev/null 2>&1 & pid=$! \
  && sleep 1 \
  && curl -fsS http://127.0.0.1:8182/data/skills-core-domains.json | rg -n "Agent Discovery" \
  && rg -n "Core Domains" "$tmpdir/dist" -g '*.js' \
  && kill "$pid" \
  && rm -rf "$tmpdir"
```

验收点：

- Core Domains 页面字段为英文
- JSON 中领域名称与说明为英文

## 发布 / 部署

- 无（数据与前端静态资源更新）

## 影响范围 / 风险

- Breaking change? 否
- 风险：历史缓存仍指向旧数据时出现语言混杂
- 回滚方式：恢复旧数据 JSON
