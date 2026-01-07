# v0.1.0 Headless 本地包管理器

**发布时间**: 2026-01-08  
**版本**: v0.1.0

---

## 🎯 本次迭代目标

做一个真正可用的“无头、本地优先”技能包管理器：

- 不做任何云端数据存储（无 registry / 无 search / 无 publish）
- 以本地可追溯、可回滚、可复现为核心

---

## ✅ 完成事项

### 🧠 Core（`packages/core`）

- 新增 `@skild/core`（headless）：把业务逻辑收敛为单一来源（避免 CLI 重复实现）
- 本地存储设计：
  - 全局：`~/.skild/config.json`（默认平台/范围）
  - 锁文件：`~/.skild/lock.json`（全局安装）与 `./.skild/lock.json`（项目级安装）
  - 单个 Skill 元数据：`<skill>/.skild/install.json`
- 安装稳定性：采用 “staging → 校验 → 原子替换” 避免失败时破坏旧版本
- 校验能力：解析 `SKILL.md` YAML frontmatter（最小必需：`name`/`description`）

### 🛠️ CLI（`packages/cli`）

实现 v0.1 闭环命令（均为本地能力）：

- `skild install <source>`：安装（支持 Git URL / degit / 本地目录），默认不覆盖，需 `--force`
- `skild list`：列出已安装（支持 `--json`）
- `skild info <skill>`：查看安装元数据与校验结果（支持 `--json`）
- `skild validate [path|skill]`：校验 Skill（支持 `--json`，失败 exit code=1）
- `skild uninstall <skill>`：卸载（缺元数据时需 `--force`）
- `skild update [skill]`：更新单个或全部（基于本地元数据的 source）
- `skild init <name>`：生成 Skill 模板（可立即 `validate`）

### 🚢 Release（Changesets）

- `docs/logs/v0.1.0-headless/2026-01-08-release-changesets.md`：发布流程升级与脚本说明
- `docs/logs/v0.1.0-headless/2026-01-08-release-npm-token.md`：用 `NPM_TOKEN` 消除 OTP/浏览器交互（无交互发布）

---

## 🧪 验证结果

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck

pnpm cli --help
pnpm cli install ./examples/hello-skill -t codex --local
pnpm cli list -t codex --local
pnpm cli info hello-skill -t codex --local
pnpm cli validate hello-skill -t codex --local
pnpm cli uninstall hello-skill -t codex --local --force
```

---

## 🚫 明确不做（v0.1）

- registry / search / publish（任何云端数据存储）
- Web UI 的业务逻辑（保持 UI 与业务解耦）
