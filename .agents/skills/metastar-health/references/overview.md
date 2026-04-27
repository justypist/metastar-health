# 总览

MetaStar Health API 函数从项目根目录的 `api/index.ts` 统一导入。

## 安全边界

- 使用 `APP_KEY`、`APP_SECRET` 和 `OPEN_API_BASE_URL` 等环境变量或调用方传入配置处理认证。
- 不在示例中写入真实凭据、真实业务文件路径或自动执行真实网络请求。
- 只有用户明确提供输入并授权调用时，才执行会访问远端服务的代码。
