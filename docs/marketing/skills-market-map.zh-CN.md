# Skills 市场地图与优先级清单（面向 Skild）

目的：提供一份可以直接用于产品定位、Landing Page 和路线图规划的高价值技能地图；强调“可落地、可组合、可规模化”的技能与组合包。

范围：聚焦在公开社区与商业场景里最常见、最具复用价值的“技能/流程型技能组合”。以下内容可直接映射为 Skild 的 skill（单一能力）或 skill pack（组合能力）。

## 结论：最重要的 5 个分类（优先级从高到低）

1) 软件工程与交付
2) 产品与决策
3) 数据分析与洞察
4) 增长与市场传播
5) 运营与客户成功

这些分类覆盖了“从需求 -> 交付 -> 验证 -> 传播 -> 运营”的完整闭环，是用户付费意愿最高、复用最强、可形成长期复购的方向。

## 选择标准（筛选逻辑）

- ROI 高：直接节省工程/产品/运营时间
- 闭环强：具备输入 -> 处理 -> 产出 -> 验证的完整路径
- 复用性高：适配多行业、多团队、多规模
- 可组合：天然能与其他 skills 拼接成可交付工作流
- 结果可衡量：可以通过质量/速度/成本/转化进行评估

## 分类一：软件工程与交付（10 个）

1) repo-intel（代码库极速上手）
- 价值：快速理解现有代码结构、关键入口与依赖关系
- 典型输入：仓库路径、关键模块/功能说明
- 产出：架构摘要、入口/依赖图、关键文件索引
- 组合：配合 code-review / refactor-planner

2) spec-to-plan（需求到技术方案）
- 价值：把 PRD 变成可执行的技术方案与任务拆解
- 典型输入：PRD/用户故事
- 产出：技术方案、任务列表、风险清单
- 组合：配合 test-plan / release-readiness

3) code-reviewer（风险导向代码评审）
- 价值：定位潜在 bug、回归风险、安全问题
- 典型输入：PR diff 或变更描述
- 产出：风险清单、建议修复、测试建议
- 组合：配合 test-generator

4) test-generator（测试生成与覆盖检查）
- 价值：补齐覆盖不足、减少回归
- 典型输入：模块代码、用例说明
- 产出：单测/集成测试草稿、覆盖报告
- 组合：配合 bug-fix-loop

5) bug-fix-loop（Bug 闭环）
- 价值：从复现到修复的完整闭环
- 典型输入：错误日志、复现步骤
- 产出：复现脚本、根因分析、修复补丁
- 组合：配合 test-generator

6) refactor-planner（重构规划与迁移）
- 价值：识别技术债并规划可控迁移
- 典型输入：模块现状、痛点描述
- 产出：重构计划、分阶段迁移方案
- 组合：配合 repo-intel

7) perf-optimizer（性能画像与优化建议）
- 价值：定位瓶颈并提出可执行优化
- 典型输入：性能数据/日志
- 产出：热点列表、优化建议、验证方法
- 组合：配合 benchmark-runner

8) release-readiness（发布就绪检查）
- 价值：发布前风险最小化
- 典型输入：变更记录、版本信息
- 产出：发布清单、风险项、回滚建议
- 组合：配合 changelog-writer

9) changelog-writer（变更日志自动化）
- 价值：清晰对外说明变化
- 典型输入：PR 列表、commit 信息
- 产出：结构化 changelog
- 组合：配合 release-readiness

10) cicd-doctor（CI/CD 诊断与修复）
- 价值：快速恢复流水线稳定性
- 典型输入：CI 日志、失败信息
- 产出：失败原因、修复建议、稳定性改进
- 组合：配合 test-generator

## 分类二：产品与决策（10 个）

1) prd-generator（PRD 生成）
- 价值：快速产出高质量 PRD
- 典型输入：问题陈述、目标用户
- 产出：PRD 草案、范围与假设

2) user-story-splitter（用户故事拆解）
- 价值：把需求拆成可执行任务
- 典型输入：功能需求
- 产出：用户故事、验收标准

3) roadmap-prioritizer（路线图优先级）
- 价值：帮助决策资源投入顺序
- 典型输入：候选需求列表
- 产出：优先级排序、理由与权衡

4) experiment-designer（实验设计）
- 价值：形成可验证的试验方案
- 典型输入：假设与目标
- 产出：实验方案、成功指标

5) metric-system-designer（指标体系设计）
- 价值：构建业务指标树
- 典型输入：业务目标
- 产出：北极星指标 + 指标树

6) decision-log-writer（决策记录）
- 价值：沉淀组织记忆与可追溯性
- 典型输入：讨论与方案对比
- 产出：决策记录文档

7) competitor-matrix（竞品分析矩阵）
- 价值：快速掌握市场定位与差异
- 典型输入：竞品名单
- 产出：差异化矩阵、定位建议

8) mvp-scope-keeper（MVP 范围定义）
- 价值：防止需求膨胀
- 典型输入：需求列表
- 产出：Must/Should/Could 划分

9) user-research-synthesizer（用户研究归纳）
- 价值：把访谈内容转成行动点
- 典型输入：访谈记录
- 产出：主题归纳、机会点

10) product-requirements-checklist（需求澄清清单）
- 价值：降低需求歧义
- 典型输入：需求文档
- 产出：疑点清单、追问列表

## 分类三：数据分析与洞察（10 个）

1) sql-assistant（SQL 生成与优化）
- 价值：减少分析门槛
- 典型输入：指标定义、表结构
- 产出：SQL 查询与优化建议

2) dashboard-builder（仪表盘方案）
- 价值：快速搭建关键指标看板
- 典型输入：指标列表
- 产出：看板结构与查询模板

3) funnel-analyzer（漏斗分析）
- 价值：识别转化瓶颈
- 典型输入：漏斗定义
- 产出：转化率分析与瓶颈诊断

4) cohort-retention（留存分析）
- 价值：理解用户价值曲线
- 典型输入：用户事件数据
- 产出：留存表、趋势洞察

5) anomaly-detector（异常检测）
- 价值：提前发现数据异常
- 典型输入：时间序列指标
- 产出：异常点标记与解释建议

6) forecast-planner（趋势预测）
- 价值：辅助资源规划
- 典型输入：历史数据
- 产出：预测曲线与置信区间

7) attribution-analyzer（归因分析）
- 价值：理解驱动因素
- 典型输入：多维指标
- 产出：关键因子与影响度

8) ab-test-analyzer（A/B 测试分析）
- 价值：科学验证改动效果
- 典型输入：实验数据
- 产出：显著性结论与建议

9) data-quality-checker（数据质量检查）
- 价值：保证分析可信度
- 典型输入：原始数据
- 产出：缺失/异常/重复报告

10) etl-designer（ETL 流程设计）
- 价值：规范数据流与口径
- 典型输入：数据源描述
- 产出：ETL 流程与校验点

## 分类四：增长与市场传播（10 个）

1) landing-copywriter（Landing 文案生成）
- 价值：快速产出清晰转化文案
- 典型输入：产品定位、卖点
- 产出：页面结构与文案建议

2) seo-topic-miner（SEO 选题）
- 价值：提升自然流量
- 典型输入：关键词方向
- 产出：选题列表与大纲

3) content-calendar（内容日历）
- 价值：稳定内容节奏
- 典型输入：目标渠道
- 产出：内容计划与发布节奏

4) ad-creative-variants（广告创意变体）
- 价值：快速多版本测试
- 典型输入：核心卖点
- 产出：多版本文案

5) email-lifecycle（邮件生命周期）
- 价值：激活与留存提升
- 典型输入：用户旅程
- 产出：欢迎/激活/召回邮件序列

6) social-content-factory（社媒内容工厂）
- 价值：高频输出内容
- 典型输入：主题与话术
- 产出：可批量发布内容

7) case-study-builder（客户案例包装）
- 价值：提升信任与转化
- 典型输入：客户故事
- 产出：案例结构与要点

8) launch-playbook（发布节奏设计）
- 价值：最大化发布影响
- 典型输入：发布时间与目标
- 产出：预热/发布/复盘节奏

9) brand-voice-guide（品牌语气规范）
- 价值：统一品牌表达
- 典型输入：品牌定位
- 产出：语调指南与示例

10) growth-loop-designer（增长循环设计）
- 价值：可持续增长策略
- 典型输入：产品机制
- 产出：循环路径与激励机制

## 分类五：运营与客户成功（10 个）

1) onboarding-runbook（用户 Onboarding）
- 价值：降低上手成本
- 典型输入：产品功能
- 产出：新手路径与引导材料

2) support-triage（工单分流）
- 价值：提升响应效率
- 典型输入：工单描述
- 产出：分类标签与处理建议

3) faq-builder（FAQ 构建）
- 价值：自助式答疑
- 典型输入：常见问题
- 产出：结构化 FAQ

4) incident-response（事故响应）
- 价值：缩短恢复时间
- 典型输入：事故描述
- 产出：响应流程、复盘模板

5) churn-risk-monitor（流失风险预警）
- 价值：留存提升
- 典型输入：使用数据
- 产出：风险列表与干预建议

6) renewal-playbook（续费与扩展）
- 价值：提升 LTV
- 典型输入：客户状态
- 产出：续费策略与话术

7) compliance-checker（合规检查）
- 价值：减少合规风险
- 典型输入：流程/政策
- 产出：合规清单与建议

8) ops-sop-writer（SOP 生成）
- 价值：流程标准化
- 典型输入：流程描述
- 产出：SOP 文档与升级规则

9) knowledge-base-curator（知识库整理）
- 价值：减少重复劳动
- 典型输入：已有文档
- 产出：结构化知识库目录

10) vendor-evaluator（供应商评估）
- 价值：降低采购风险
- 典型输入：候选供应商
- 产出：评估矩阵与评分

## 高价值组合包（跨分类，建议直接做成 skill pack）

1) MVP 交付闭环：prd-generator -> spec-to-plan -> test-generator -> release-readiness
2) 代码质量闭环：code-reviewer -> test-generator -> bug-fix-loop -> changelog-writer
3) 增长发布闭环：landing-copywriter -> launch-playbook -> social-content-factory
4) 指标驱动增长：metric-system-designer -> sql-assistant -> dashboard-builder -> experiment-designer
5) 客户成功闭环：onboarding-runbook -> support-triage -> faq-builder -> renewal-playbook
6) 故障治理闭环：incident-response -> cicd-doctor -> postmortem-writer（可扩展）
7) 数据治理闭环：data-quality-checker -> etl-designer -> anomaly-detector
8) 竞争分析闭环：competitor-matrix -> decision-log-writer -> roadmap-prioritizer
9) 内容工厂闭环：content-calendar -> seo-topic-miner -> social-content-factory
10) 需求澄清闭环：product-requirements-checklist -> user-story-splitter -> mvp-scope-keeper

## 建议：优先落地的 12 个 skills（最强价值密度）

- repo-intel
- spec-to-plan
- code-reviewer
- test-generator
- release-readiness
- prd-generator
- roadmap-prioritizer
- metric-system-designer
- sql-assistant
- landing-copywriter
- onboarding-runbook
- support-triage

## 备注

- 以上内容可直接映射到 Skild 的 skill/skill pack 模型；命名可进一步统一为 kebab-case。
- 如果需要我补充“具体平台/社区来源列表”和“引用链接”，可以基于目标平台（如 GPTs/Claude/Cursor 等）继续补齐。
