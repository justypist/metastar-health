## 1. 示例结构

- [x] 1.1 创建 `examples/` 目录和示例入口文件，定义安全占位参数、环境变量读取说明和手动执行约定，确保导入示例文件不会自动发起请求。
- [x] 1.2 添加可选的手动执行入口或场景索引，使用户能够按名称逐个选择示例执行，而不是默认顺序执行全部场景。

## 2. 基础能力示例

- [x] 2.1 为 `readOpenApiConfig`、`getOpenApiFetch`、`buildOpenApiUrl`、`parseOpenApiResponsePayload`、`assertSuccessfulOpenApiResponse`、`requestOpenApi`、`requestOpenApiData` 各写一个真实调用场景示例。
- [x] 2.2 为 `createUploadFormData`、`requestOpenApiUpload`、`pollAsyncTask` 各写一个真实调用场景示例，上传示例仅使用占位文件路径或环境变量路径。

## 3. 同步业务 API 示例

- [x] 3.1 为 `autocompleteEntities`、`searchPapers`、`getPapersHealth`、`searchDrugs`、`searchGbdData`、`getHpaProfile` 各写一个真实调用场景示例。

## 4. 异步任务 API 示例

- [x] 4.1 为 `submitOcrTask`、`getOcrResult`、`pollOcrResult`、`submitTextExtractionTask`、`getTextExtractionResult`、`pollTextExtractionResult` 各写一个真实调用场景示例。
- [x] 4.2 为 `submitLiteratureProcessTask`、`getLiteratureProcessResult`、`pollLiteratureProcessResult` 各写一个真实调用场景示例。
- [x] 4.3 为 `submitTargetAssistantTask`、`getTargetAssistantResult`、`pollTargetAssistantResult`、`submitTargetQuickAssessmentTask`、`getTargetQuickAssessmentResult`、`pollTargetQuickAssessmentResult` 各写一个真实调用场景示例。

## 5. 类型检查与安全核对

- [x] 5.1 如有必要，更新 TypeScript 配置或脚本，使 `examples/` 参与静态类型检查，但不被现有 `pnpm test` 自动执行。
- [x] 5.2 对照 `api/index.ts` 和各 API 模块导出核对公共函数覆盖率，确认每个公共函数都有且只有一个主要真实调用场景。
- [x] 5.3 执行静态类型检查；不要执行真实调用示例，不要运行会触发真实网络或业务副作用的测试。
