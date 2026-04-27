## Context

`api/` 目录已经按业务域提供开放 API TypeScript 函数，并通过 `api/index.ts` 统一导出。当前缺少面向 agent 的 SKILL 层：agent 需要先理解所有模块、函数和异步任务约定，才能正确选择调用方式；如果把所有 API 说明直接放入 `SKILL.md`，会导致技能加载时上下文过大。

本变更新增项目内可分发的 `metastar-health` SKILL。该 SKILL 面向 agent 说明何时使用研究平台 API，并提供按需阅读的参考文档，让 agent 只在需要某个业务域时加载对应函数说明。

## Goals / Non-Goals

**Goals:**

- 提供 `metastar-health` SKILL，覆盖 `api/` 中已实现的全部开放 API 能力。
- 根据当前可用 API 模块生成或校验 SKILL `description`，让触发说明与实际导出能力保持一致。
- 将 API 用法拆分为多个按需资源文档，入口 `SKILL.md` 保持精简。
- 保持现有 API TypeScript 函数签名、认证、请求封装和测试行为不变。

**Non-Goals:**

- 不新增开放 API 端点或修改远端接口行为。
- 不把 PDF 原始文档内容完整复制到 SKILL 中。
- 不在 SKILL 中内置真实凭据、真实业务文件路径或自动执行真实网络请求。
- 不引入新的运行时依赖来完成简单的生成和校验。

## Decisions

- SKILL 采用项目内目录 `.agents/skills/metastar-health/`。
  选择项目内目录便于随代码版本化、审查和发布；不直接写入用户本机 `~/.config/opencode/skills/`，避免实现变更产生本机环境副作用。需要启用时可由用户或后续发布流程复制/链接到实际技能目录。

- `SKILL.md` 只放 frontmatter、能力总览、认证约束和资源索引。
  入口文件必须包含 `name: metastar-health` 与自动生成的 `description`。正文只描述何时使用、如何选择资源文档、如何从 `api/index.ts` 导入函数，以及不要真实调用 API 的安全提醒。完整参数、返回值和示例放在资源文件中，避免一次性加载所有 API 用法。

- API 参考按业务和调用模式拆分。
  建议布局为 `.agents/skills/metastar-health/references/overview.md`、`sync-search.md`、`async-doc-processing.md`、`target-workflows.md`、`api-map.md`。同步搜索类 API 包括论文、实体补全、药物、HPA、GBD；文档处理类 API 包括 OCR、文本提取、文献解析；靶点工作流类 API 包括靶点助手和快速评估。该拆分与 agent 的常见任务意图一致，比按每个文件创建独立文档更容易导航，也比单一大文档更节省上下文。

- `description` 由生成脚本基于可用模块清单生成。
  新增轻量脚本扫描 `api/index.ts` 的公共导出路径，并用本地领域元数据映射生成 description 与 API 能力表。脚本只使用 Node.js 内置模块和 TypeScript 源文件字符串解析，避免引入 AST 依赖。若某个 API 模块未从 `api/index.ts` 导出，对应能力不得出现在生成结果中。

- 使用生成标记保护可维护区域。
  `SKILL.md` frontmatter description 和 `references/api-map.md` 中的能力表由脚本写入或校验，使用明确的 `BEGIN GENERATED` / `END GENERATED` 标记限制更新范围。人工编写的工作流说明不应被脚本覆盖。

- 校验优先，生成可选。
  脚本支持默认写入和 `--check` 校验两种模式。实现任务中应添加自动化测试或 `node --test` 用例覆盖模块扫描、description 生成和缺失导出检测；静态类型检查继续使用现有 `pnpm check`。

## Risks / Trade-offs

- [Risk] `api/` 函数重命名后 SKILL 参考文档可能过期 → 通过生成脚本和测试校验 `api/index.ts` 导出与能力表一致。
- [Risk] 入口 description 过长影响技能发现质量 → 生成时限制为一句紧凑描述，列出能力类别而不是所有函数名。
- [Risk] 分拆文档会让 agent 找错资源 → 在 `SKILL.md` 提供明确任务到参考文档的路由表，并在每个参考文档顶部列出覆盖函数。
- [Risk] 异步 API 被误认为同步结果可立即返回 → 在相关参考文档中统一强调 submit/result/poll 函数选择和建议轮询间隔。
- [Risk] 项目内 SKILL 目录未被当前运行环境自动发现 → 本变更只交付版本化技能资产，启用或安装流程由后续使用方式决定。
