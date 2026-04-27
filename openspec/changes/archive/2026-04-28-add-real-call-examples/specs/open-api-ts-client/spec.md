## ADDED Requirements

### Requirement: 真实调用示例覆盖
开放 API TypeScript 客户端 SHALL 在 `examples/` 中提供面向真实开放 API 的手动调用示例，且每个从统一入口可访问的公共函数 SHALL 至少对应一个独立调用场景。

#### Scenario: 每个公共函数都有示例场景
- **WHEN** 查看 `api/index.ts` 统一入口可访问的公共函数以及 `examples/` 目录
- **THEN** 每个公共函数都有一个具名示例函数或等价独立片段展示真实调用参数、返回值处理和错误处理入口

#### Scenario: 示例不在导入时自动执行
- **WHEN** 调用方导入任意示例文件
- **THEN** 示例文件不会立即访问真实开放 API、读取上传文件或发起异步任务

#### Scenario: 用户手动逐个执行示例
- **WHEN** 用户准备好真实环境变量和业务输入后选择某一个示例场景执行
- **THEN** 只运行该场景对应的公共函数调用，不自动串行执行全部示例

#### Scenario: 示例不包含敏感信息
- **WHEN** 查看 `examples/` 目录中的示例代码
- **THEN** 示例通过环境变量或占位值读取 `APP_KEY`、`APP_SECRET`、`OPEN_API_BASE_URL` 和本地文件路径，不提交真实密钥或真实业务文件

### Requirement: 示例静态类型安全
真实调用示例 MUST 使用项目现有 TypeScript 类型和公共导出表达参数与返回值，不得引入 `any`，并 SHALL 能通过项目静态类型检查。

#### Scenario: 示例参与类型检查
- **WHEN** 执行项目静态类型检查
- **THEN** `examples/` 中的示例代码与 `api/` 客户端代码一起完成类型检查且不产生 TypeScript 错误

#### Scenario: 示例不纳入自动测试套件
- **WHEN** 执行现有自动化测试命令
- **THEN** 测试套件不会默认执行真实调用示例，避免访问真实网络或产生业务副作用
