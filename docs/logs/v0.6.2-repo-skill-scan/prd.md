# PRD: v0.6.2-repo-skill-scan

## 背景/问题
- Markdown 安装时链接可能指向仓库根或子目录。
- 仓库既可能是单一 skill，也可能包含多个 skill。
- 目前 markdown 递归深度与目录扫描深度复用，`--depth 0` 时容易漏掉仓库子目录 skills。

## 目标
- 识别仓库链接的单一 skill 或多 skill 子目录。
- Markdown 递归深度与目录扫描深度解耦，默认 `--depth 0` 仅控制文档递归。
- 多 skill 仓库链接在树形展示中按子目录层级展开。
- 提取每个 skill 的元数据（name/description），并在选择树中展示描述。
- 保持现有进度提示与 `--max-skills` 安全上限。

## 非目标
- 不调整 registry 协议或发布流程。
- 不改动 skill 格式与安装执行逻辑。

## 用户故事
- 作为用户，我希望 `--depth 0` 不再递归其他文档，但仍能从仓库链接中发现子目录 skills。

## 验收标准
- `skild install <markdown repo> --depth 0` 仍可识别仓库子目录技能（由 `--scan-depth` 控制）。
- CLI 帮助与安装文档包含 `--scan-depth`，并更新 `--depth` 语义。
