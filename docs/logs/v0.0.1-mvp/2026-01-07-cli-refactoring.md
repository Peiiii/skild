# 2026-01-07: CLI 代码重构优化

## 概述

对 `packages/cli/src` 进行了中度重构，以提升代码可维护性和清晰度。

## 变更摘要

### 新增文件 (6个)

| 文件 | 用途 |
|------|------|
| `constants.ts` | 集中管理错误消息、平台列表、默认值 |
| `types/index.ts` | 统一类型导出，新增 `isPlatform` 类型守卫 |
| `utils/logger.ts` | 统一日志/spinner 封装 |
| `utils/fs-helpers.ts` | 文件系统辅助函数 |
| `services/source-parser.ts` | URL/路径解析逻辑 |
| `services/skill-installer.ts` | 核心安装逻辑封装 |

### 重构文件 (4个)

| 文件 | 变更 |
|------|------|
| `index.ts` | 使用 `isPlatform` 类型守卫，消除 `as any` |
| `commands/install.ts` | 命令层负责 spinner/退出码，安装逻辑委托给 `skill-installer` |
| `commands/list.ts` | 使用 `logger` 和 `fs-helpers` |
| `utils/config.ts` | 复用共享类型和常量 |

## 代码结构对比

### Before
```
src/
├── commands/
│   ├── install.ts   (153 行)
│   └── list.ts      (40 行)
├── types/
│   └── degit.d.ts
├── utils/
│   └── config.ts    (55 行)
└── index.ts         (58 行)

Total: ~300 行, 5 文件
```

### After
```
src/
├── commands/
│   ├── install.ts            # 命令层：参数/输出/退出码
│   └── list.ts               # 命令层：列出已安装技能
├── services/                  ✨ 新增
│   ├── source-parser.ts       # source 解析/归一化
│   └── skill-installer.ts     # 安装：staging → 校验 → 原子替换
├── types/
│   ├── degit.d.ts
│   └── index.ts               # 类型与类型守卫
├── utils/
│   ├── config.ts             # skills 目录规则
│   ├── logger.ts             # 日志/spinner
│   └── fs-helpers.ts         # FS 工具（含原子替换）
├── constants.ts              # 常量与错误消息
└── index.ts         (58 行)
```

## 改进点

1. **类型安全提升** - 使用 `isPlatform` 类型守卫替代 `as any` 断言
2. **单一职责** - 每个文件职责明确，便于测试和维护
3. **可复用性** - `logger`, `fs-helpers` 可被未来命令复用
4. **安装更安全** - 采用“临时目录 staging → 校验 → 原子替换”避免失败时误删旧版本
5. **错误消息集中** - 便于国际化和一致性

## 验证结果

```bash
✅ pnpm build       # 构建成功
✅ pnpm lint        # lint 通过
✅ pnpm typecheck   # 类型检查通过
✅ pnpm cli --help  # 帮助输出正常
✅ pnpm cli install ./examples/hello-skill -t codex --local
✅ pnpm cli list -t codex --local
```

## 后续建议

- 添加单元测试 (`source-parser.test.ts`, `skill-installer.test.ts`)
- 新增 `uninstall`, `update`, `search` 命令时复用 services 层
