# 2026-01-07 CLI 使用体验修复记录

**日期**: 2026-01-07  
**范围**: `packages/cli` + 文档 + 示例  
**背景**: 回答“怎么使用 skild / 功能测试过了吗”，并把仓库现状与对外文档对齐

---

## 🎯 本次目标

1. 明确“用户怎么用 / 开发时怎么用”的最短路径
2. CLI 行为与 README 承诺一致（避免文档误导）
3. 补齐最基本的功能验证（build/lint/typecheck + 冒烟跑通）

---

## ✅ 主要变更

### 🛠️ CLI（`packages/cli`）

- `list` 支持 `-t/--target` 与 `--local`，与 `install` 的安装位置/平台一致
- `install` 支持 3 种 source：
  - GitHub URL（`https://github.com/.../tree/.../...`）
  - degit 简写（`owner/repo/subdir#ref`）
  - 本地目录（`./path/to/skill`）
- 修复 `pnpm cli -- install ...` 会把多余的 `--` 传入导致参数解析错位的问题（自动剥离 argv[2] 的 `--`）
- 避免依赖 `npx degit`（改用 degit JS API），减少外部行为不确定性
- 针对常见误用做强约束：
  - 如果最终落盘目录为空，直接报错提示正确用法（避免“安装成功但啥都没有”）

### 📚 文档与示例

- 更新 `README.md` / `README.zh-CN.md`：明确已实现命令只有 `install` / `list`，并给出“安装目录”和“开发仓库内运行”的准确用法
- 新增 `docs/cli.md`：集中放 CLI 用法与平台路径说明
- 新增 `examples/hello-skill/SKILL.md`：用于本地安装/列表的快速回归样例
- 纠正示例 URL：Anthropic 官方 skills 仓库结构为 `.../tree/main/skills/<skill>`

### 🧰 工程化

- 根目录补充 `typecheck`/`typecheck:cli` 脚本，确保“每阶段至少一次验证”可一键跑
- 为 `degit` 增加 TS 类型声明（避免 `tsc` 报 `TS7016`）

---

## 🧪 验证结果（冒烟）

### 构建 / 静态检查

```bash
pnpm build
pnpm lint
pnpm typecheck
```

### 功能路径

```bash
# CLI 帮助与参数
pnpm cli --help

# 本地样例安装（Codex + 项目级）
pnpm cli install ./examples/hello-skill -t codex --local
pnpm cli list -t codex --local

# GitHub URL 安装（正确路径）
pnpm cli install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local

# GitHub URL 安装（错误路径会直接报错，提示修正为 /skills/<name>）
pnpm cli install https://github.com/anthropics/skills/tree/main/pdf -t codex --local
```

---

## 🧩 已知限制

- “registry name” 安装（`skild install <name>`）尚未实现
- `uninstall/info/search/init/validate/publish` 仍在规划中，文档已标注为未实现

---

## 🚀 下一步（建议）

- 增加 `skild validate`（最小可用：校验 `SKILL.md` Frontmatter + 基础目录结构）
- 加一个最小 e2e 脚本（不引入测试框架也行），覆盖：local install / github tree install / list 的回归
