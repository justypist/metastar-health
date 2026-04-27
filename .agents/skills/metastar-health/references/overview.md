# 总览

MetaStar Health API 函数由 `scripts/` 提供，统一入口为 `scripts/index.ts`。本技能描述何时选择对应函数、需要哪些参数、如何处理返回结构和副作用边界。

## 安全边界

- 使用 `APP_KEY`、`APP_SECRET` 和 `OPEN_API_BASE_URL` 等环境变量或调用方传入配置处理认证。
- 不在示例中写入真实凭据、真实业务文件路径或自动执行真实网络请求。
- 只有用户明确提供输入并授权调用时，才执行会访问远端服务的代码。

## 使用实现

- 从 `scripts/index.ts` 按需导入函数，例如 `import { searchPapers } from "./scripts/index.ts"`。
- `scripts/` 内按能力拆分实现，请求、上传、轮询和错误处理不依赖外部源码目录。
