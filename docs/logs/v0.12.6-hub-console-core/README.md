# 2026-02-04 Hub Console Core Domains

## 背景 / 问题

- Hub 缺少“聚焦领域 + 高信号技能”的展示，用户难以快速理解可用价值
- 需要把核心领域清单落到 hub.skild.sh，并展示标签、摘要与核心指标

## 决策

- 在 Console 新增独立页面 `/core`，集中展示核心领域与技能卡片
- 数据从同域 `/data/skills-core-domains.json` 异步加载，避免跨域与包体膨胀
- 抓取脚本同时输出到 web/console public，保证数据可部署

## 变更内容

- 新增 Console 页面：`apps/console/src/ui/pages/CoreDomainsPage.tsx`
- 新增 Console 路由：`/core`
- 顶部导航与移动端底栏加入 Core 入口
- 数据脚本同步写入 `apps/console/public/data/skills-core-domains.json`

## 功能说明

- **目标**：在 hub.skild.sh 展示核心领域精选与技能摘要、标签、指标
- **输入**：浏览器访问 `/core` 时 fetch `/data/skills-core-domains.json`
- **输出**：领域卡片 + 技能卡片（summary/tags/stars/installs）
- **默认策略与边界**：
  - 同域静态 JSON 加载，失败时显示错误提示
  - 指标缺失时展示 `—` 占位

## 使用方式

```bash
# 示例 1：打开 Hub Core 页面
open https://hub.skild.sh/core

# 示例 2：查看数据源
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
  && python3 -m http.server --directory "$tmpdir/dist" 8181 >/dev/null 2>&1 & pid=$! \
  && sleep 1 \
  && curl -fsS http://127.0.0.1:8181/data/skills-core-domains.json | rg -n "\"domains\"" \
  && rg -n "Core Domains" "$tmpdir/dist" -g '*.js' \
  && kill "$pid" \
  && rm -rf "$tmpdir"
```

验收点：

- `/core` 页面可见 “Core Domains” 且渲染领域列表
- `/data/skills-core-domains.json` 可被 Console 静态访问

## 发布 / 部署

- 无（Console 页面与静态数据更新）

## 影响范围 / 风险

- Breaking change? 否
- 风险：静态 JSON 缺失会导致页面提示失败
- 回滚方式：移除 `/core` 路由与数据文件
