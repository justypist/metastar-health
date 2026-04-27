## ADDED Requirements

### Requirement: API 文件测试覆盖
开放 API TypeScript 客户端 SHALL 为 `api/` 目录下每个源文件提供对应的自动化测试用例，测试覆盖该文件的公共导出、请求构造、响应处理、错误处理或类型契约等可验证行为。

#### Scenario: 每个 API 源文件都有测试
- **WHEN** 查看 `api/` 目录下的任意 TypeScript 源文件
- **THEN** 存在对应测试用例覆盖该文件的主要职责，且测试文件不会被 `api/index.ts` 作为公共 API 导出

#### Scenario: 公共请求封装被测试保护
- **WHEN** 测试 `client.ts`、`config.ts`、`upload.ts` 和 `polling.ts`
- **THEN** 测试覆盖配置读取、认证头、URL 与查询参数、JSON 请求体、multipart 表单、响应解析、错误抛出、任务完成、任务失败和轮询超时行为

#### Scenario: 业务 API 函数构造正确请求
- **WHEN** 测试 `autocomplete.ts`、`papers.ts`、`drugs.ts`、`gbd.ts`、`hpa.ts`、`ocr.ts`、`text-extraction.ts`、`literature-process.ts`、`target-assistant.ts` 和 `target-quick-assessment.ts`
- **THEN** 每个公共函数使用预期路径、HTTP 方法、查询参数、请求体或上传参数调用底层请求封装，并正确返回解析后的数据

#### Scenario: 统一导出入口保持完整
- **WHEN** 测试 `index.ts`
- **THEN** 统一入口导出全部公共 API 函数、配置能力和主要类型入口，且不导出测试私有内容

#### Scenario: 类型定义保持安全
- **WHEN** 测试或类型检查 `types.ts` 以及依赖这些类型的 API 模块
- **THEN** 公共类型可被正常导入使用，并继续使用 `unknown`、联合类型或接口表达扩展字段而不是 `any`

### Requirement: 测试无业务副作用
开放 API TypeScript 客户端测试 MUST NOT 访问真实开放 API、使用真实凭据、上传真实业务文件或创建业务数据。

#### Scenario: 网络请求全部被模拟
- **WHEN** 执行任意会触发请求路径的测试用例
- **THEN** 测试使用注入的 fake fetch 或等价模拟对象断言请求，不会调用 `globalThis.fetch` 访问真实网络

#### Scenario: 上传测试只使用非业务数据
- **WHEN** 执行文件上传相关测试用例
- **THEN** 测试仅使用内存构造的 Blob、Uint8Array 或临时非业务 fixture，不会上传真实业务文件

#### Scenario: 异步轮询测试不产生真实等待或任务
- **WHEN** 执行轮询相关测试用例
- **THEN** 测试通过受控 Promise、短间隔、AbortController 或 fake timer 验证状态变化，不会创建真实远端任务

#### Scenario: 用户手动决定是否执行测试
- **WHEN** 实现该变更
- **THEN** 默认只添加测试和执行静态类型检查，不主动运行测试套件；测试执行由用户手动触发
