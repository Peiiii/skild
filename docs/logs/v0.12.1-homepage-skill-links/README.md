# v0.12.1 homepage-skill-links

## 迭代完成说明

- 首页右侧 Trending Skills 列表的 skill 名称改为可点击链接。
- 点击后跳转到对应 GitHub 仓库地址，使用新窗口打开并保持现有 hover 样式。

## 功能说明

- **目标**：让用户从首页快速进入 skill 对应的 GitHub 仓库。
- **输入**：用户在 Trending Skills 列表点击 skill 名称。
- **输出**：打开 `https://github.com/<repo>` 新窗口/新标签。
- **默认策略与边界**：
  - 仓库地址由 `repo` 字段拼接为 GitHub 链接。
  - 仅作用于 skill 名称文本，不影响复制命令按钮。

## 使用方式

- 示例 1：在首页右侧列表点击 `vercel-react-best-practices`，跳转到 `https://github.com/vercel-labs/agent-skills`。
- 示例 2：在首页右侧列表点击 `browser-use`，跳转到 `https://github.com/browser-use/browser-use`。

## 测试/验证/验收方式

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟（非仓库目录）：
  - `tmpdir=$(mktemp -d) && cp -R /Users/peiwang/Projects/skild/apps/web/dist "$tmpdir/dist" && rg "https://github.com/vercel-labs/agent-skills" "$tmpdir/dist/index.html" && rm -rf "$tmpdir"`

验收点：

- 构建产物 `index.html` 中出现 `https://github.com/vercel-labs/agent-skills` 链接，且为 skill 名称的 anchor。

## 发布/部署方式

- 无（本次未执行发布/部署）。

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：恢复 `apps/web/src/components/PopularSkills.astro` 中 skill 名称为非链接文本。
