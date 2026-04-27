## Why

当前开放 API 文档仅以 PDF/Markdown 内容存在，调用方需要手动拼接 URL、认证头、表单、轮询逻辑和响应解析，容易产生重复代码和不一致错误。

将文档中的全部接口抽取为可直接运行的 TypeScript 函数，可以让后续脚本或集成方通过统一客户端安全、稳定地调用研究平台 API。

## What Changes

- 在 `api/` 目录新增 TypeScript API 客户端代码，覆盖 PDF 文档中的认证、同步查询、异步提交和结果轮询接口。
- 提取公共配置、认证头、基础 URL、请求封装、错误处理、文件上传和异步任务轮询逻辑。
- 使用 `.env` 中的 `APP_KEY`、`APP_SECRET` 作为密钥来源，并以 `.env.example` 作为变量模板。
- 为 OCR、临床前文本提取、文献解析、论文搜索、实体自动补全、靶点助手、靶点快速评估、药物搜索、HPA 画像和 GBD 查询分别提供清晰的函数入口。
- 使用 TypeScript 类型描述请求参数、响应包装、任务状态和主要业务数据结构，避免使用 `any`。

## Capabilities

### New Capabilities

- `open-api-ts-client`: 提供研究平台开放 API 的 TypeScript 函数客户端，支持统一认证、公共请求封装、文件上传、同步查询和异步任务轮询。

### Modified Capabilities

- 无。

## Impact

- 新增 `api/` 下的 TypeScript 源文件与导出入口。
- 读取运行时环境变量 `APP_KEY`、`APP_SECRET`，必要时支持默认 Base URL `https://search-alpha.metastar-health.com/prod-api`。
- 依赖 Node.js LTS 原生能力运行 TypeScript，并使用 Node 内置 `fetch`、`FormData`、`Blob`/文件流等能力完成请求。
- 不修改服务端 API 行为，不引入破坏性变更。
