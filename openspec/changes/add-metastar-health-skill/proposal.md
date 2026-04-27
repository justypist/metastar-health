## Why

现有开放 API 已在 `api/` 下封装为 TypeScript 函数，但 agent 使用时仍需要一次性理解所有函数、参数和异步轮询模式，容易造成上下文膨胀和错误调用。新增 `metastar-health` SKILL 可以把这些 API 组织成面向 agent 的分层工具说明，并按任务场景按需加载具体 API 用法。

## What Changes

- 新增 `metastar-health` SKILL，面向 agent 暴露研究平台开放 API 的能力说明和使用入口。
- 根据 `api/` 下已实现的 API 模块自动或半自动生成 SKILL `description`，覆盖 OCR、临床前文本提取、文献解析、论文搜索、实体补全、靶点研究、靶点快速评估、药物搜索、HPA 画像和 GBD 查询。
- 采用分层 SKILL 布局，入口 `SKILL.md` 只包含总览、触发场景和按需加载索引，具体 API 使用方式拆分到资源文档，避免加载 SKILL 时一次性注入全部 API 细节。
- 增加生成或校验机制，确保 SKILL 中声明的 API 能力与 `api/index.ts` 及业务模块导出保持一致。

## Capabilities

### New Capabilities
- `metastar-health-skill`: 定义面向 agent 的 `metastar-health` SKILL，支持按研究任务发现并调用 `api/` 下的开放 API TypeScript 函数，同时避免一次性加载所有 API 细节。

### Modified Capabilities

## Impact

- 影响新增的 SKILL 文件与资源文档目录，生成位置为 `.agents/skills/metastar-health/`。
- 影响 `api/` 模块导出扫描或元数据生成逻辑，用于生成 SKILL 描述和 API 索引。
- 不改变现有开放 API TypeScript 函数签名、请求行为或认证方式。
- 需要通过 TypeScript 静态检查和针对生成逻辑或文档结构的轻量测试/校验保护一致性。
