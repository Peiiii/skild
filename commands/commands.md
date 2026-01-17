# Commands

- `/new-command`: 新建一条指令的元指令。流程：确认名称、用途、输入格式、输出/期望行为，写入本文件并保持 `AGENTS.md` 索引同步。
- `/config-meta`: 调整或更新 `AGENTS.md` 中的机制/元信息（如规则、流程、索引等）的指令。执行时需明确变更点与预期影响。
- `/commit`: 进行提交操作（提交信息需使用英文）。
- `/validate`: 对项目进行验证，至少运行 `build`、`lint`、`tsc`，必要时补充冒烟测试。执行前需确认验证范围和可跳过项。

（后续指令在此追加，保持格式一致。） 

---

## extract-github-skills

- **名称**：`extract-github-skills`
- **用途**：从 GitHub 链接解析技能树并导出完整技能目录（含全部文件）。
- **输入格式**：`skild extract-github-skills <source> [--out <dir>] [--force] [--depth <n>] [--scan-depth <n>] [--max-skills <n>]`
- **输出/期望行为**：
  - 输出目录树与 `catalog.json`
  - 每个技能目录包含完整内容与 `skill.json`
