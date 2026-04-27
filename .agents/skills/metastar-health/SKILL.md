---
name: metastar-health
# BEGIN GENERATED description
description: "使用 MetaStar Health 开放 API 进行研究任务，按需调用实体补全、药物搜索、GBD 查询、HPA 画像、文献解析、OCR、论文搜索、靶点助手、靶点快速评估、临床前文本提取能力。"
# END GENERATED description
---

# MetaStar Health

使用本技能帮助 agent 发现并安全调用 MetaStar Health 开放 API。入口只提供导航和约束，具体函数参数、返回字段和示例按需阅读 `references/` 资源文档。

## 触发场景

- 用户需要检索论文、药物、疾病负担、HPA 靶点画像或补全疾病、药物、靶点、公司实体。
- 用户需要对文档执行 OCR、临床前模型文本提取或文献结构化解析。
- 用户需要提交靶点助手研究任务，或批量执行靶点快速评估。
- 用户询问 MetaStar Health 开放 API 的 TypeScript 函数和异步任务轮询方式。

## 认证

- 使用环境变量或调用方传入配置提供 `APP_KEY`、`APP_SECRET` 和 `OPEN_API_BASE_URL`。
- 不要在技能文档、示例或测试中写入真实凭据、真实业务文件路径或用户私有数据。

## 安全边界

- 加载本技能或阅读资源文档时不得自动访问真实网络、上传文件或创建远端异步任务。
- 只有用户明确提供输入并授权调用后，才执行会访问开放 API 的代码。
- 对异步任务优先使用对应 `poll*` 函数，并设置合理轮询间隔、超时和失败状态处理。

## 资源索引

- `references/overview.md`：先阅读此文档了解通用调用模式、认证配置和副作用边界。
- `references/sync-search.md`：论文搜索、实体补全、药物搜索、HPA 画像和 GBD 查询。
- `references/async-doc-processing.md`：OCR、临床前文本提取和文献解析的提交、查询与轮询。
- `references/target-workflows.md`：靶点助手和靶点快速评估工作流。
- `references/api-map.md`：由脚本维护的 API 能力表，用于确认业务模块和公共函数名。
