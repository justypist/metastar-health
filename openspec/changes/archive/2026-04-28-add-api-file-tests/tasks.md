## 1. 测试基础配置

- [x] 1.1 在 `package.json` 增加基于 Node 内置测试运行器的 `test` 脚本，但实现过程中不执行该脚本
- [x] 1.2 确认测试文件命名、导入方式和 TypeScript 配置可被 `pnpm check` 覆盖，且不需要真实凭据或真实网络

## 2. 公共基础模块测试

- [x] 2.1 为 `api/config.ts` 添加测试，覆盖环境变量、override 和缺失凭据错误
- [x] 2.2 为 `api/types.ts` 添加测试，覆盖 `OpenApiRequestError` 字段保留和公共类型导入编译约束
- [x] 2.3 为 `api/client.ts` 添加测试，覆盖 fetch 解析、URL 构造、查询参数、JSON body、认证头、响应解析和错误抛出
- [x] 2.4 为 `api/upload.ts` 添加测试，覆盖内存文件 FormData、额外字段、上传认证头、查询参数和错误响应，不使用真实业务文件
- [x] 2.5 为 `api/polling.ts` 添加测试，覆盖任务完成、任务失败、超时和 abort 场景，避免长时间真实等待

## 3. 同步业务 API 模块测试

- [x] 3.1 为 `api/autocomplete.ts` 添加测试，覆盖实体补全路径与查询参数
- [x] 3.2 为 `api/papers.ts` 添加测试，覆盖论文搜索和健康检查路径、查询参数与返回值
- [x] 3.3 为 `api/drugs.ts` 添加测试，覆盖药物搜索 POST 方法、请求体和返回值
- [x] 3.4 为 `api/gbd.ts` 添加测试，覆盖 GBD 搜索 POST 方法、请求体和返回值
- [x] 3.5 为 `api/hpa.ts` 添加测试，覆盖 HPA 查询路径、target 参数和 aliases 数组归一化

## 4. 异步任务业务 API 模块测试

- [x] 4.1 为 `api/ocr.ts` 添加测试，覆盖提交上传、结果查询路径编码和轮询入口
- [x] 4.2 为 `api/text-extraction.ts` 添加测试，覆盖提交上传、结果查询路径编码和轮询入口
- [x] 4.3 为 `api/literature-process.ts` 添加测试，覆盖提交上传、结果查询路径编码和轮询入口
- [x] 4.4 为 `api/target-assistant.ts` 添加测试，覆盖提交成功、提交校验失败、结果查询路径编码和轮询入口
- [x] 4.5 为 `api/target-quick-assessment.ts` 添加测试，覆盖提交 POST、结果查询路径编码和轮询入口

## 5. 统一导出与最终校验

- [x] 5.1 为 `api/index.ts` 添加测试，覆盖公共模块导出完整且不导出测试私有内容
- [x] 5.2 运行 `pnpm check` 做最终类型检查；不要执行 `pnpm test`，由用户手动决定是否运行测试套件
