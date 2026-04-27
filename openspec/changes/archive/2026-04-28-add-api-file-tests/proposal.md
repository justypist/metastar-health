## Why

当前 `api/` 目录已覆盖开放 API TypeScript 客户端能力，但缺少测试用例保护请求构造、响应解析、轮询、导出和类型约束等关键行为。补充测试可以在不触发真实业务请求、不产生业务数据的前提下，提高后续维护和重构的安全性。

## What Changes

- 为 `api/` 下每个 TypeScript 文件补充对应测试用例，覆盖公共函数、边界分支和导出契约。
- 测试必须使用 mock/fake fetch、fake timers 或纯函数断言，禁止访问真实开放 API、上传真实业务文件或写入业务数据。
- 为项目引入最小必要测试运行配置，并保持现有 `pnpm check` 类型检查可用。
- 不修改开放 API 客户端的运行时行为，不引入破坏性变更。

## Capabilities

### New Capabilities

### Modified Capabilities
- `open-api-ts-client`: 补充测试覆盖要求，确保客户端每个 `api/` 文件都有不产生业务数据的自动化测试保护。

## Impact

- 受影响代码：`api/**/*.ts` 对应测试文件、测试配置、`package.json` 脚本与必要开发依赖。
- 受影响系统：仅本地测试与 CI 类型检查/测试流程；不会调用真实开放 API 或创建业务数据。
- 风险：测试引入可能需要对少量实现细节做可测试性调整，但应避免改变公共 API 行为。
