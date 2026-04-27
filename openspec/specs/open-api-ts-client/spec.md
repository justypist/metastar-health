### Requirement: 环境配置与认证
客户端 SHALL 从运行环境读取 `APP_KEY` 和 `APP_SECRET`，并在所有开放 API 请求中自动添加 `x-app-key` 和 `x-app-secret` 请求头。

#### Scenario: 使用环境变量发送认证头
- **WHEN** 调用任意 API 函数且环境变量中存在 `APP_KEY` 和 `APP_SECRET`
- **THEN** 客户端发出的请求包含对应的 `x-app-key` 和 `x-app-secret` 请求头

#### Scenario: 缺少密钥时阻止请求
- **WHEN** 调用任意 API 函数但缺少 `APP_KEY` 或 `APP_SECRET`
- **THEN** 客户端在发送网络请求前抛出可读错误

### Requirement: 公共请求封装
客户端 SHALL 统一处理 Base URL、查询参数、JSON 请求体、multipart/form-data 文件上传、响应解析和错误抛出。

#### Scenario: 同步 JSON 接口请求成功
- **WHEN** 调用同步查询函数且服务端返回成功响应
- **THEN** 客户端返回解析后的业务数据与服务端附加字段

#### Scenario: 文件上传接口请求成功
- **WHEN** 调用文件上传提交函数并传入有效文件
- **THEN** 客户端使用 `multipart/form-data` 上传文件且不手动覆盖自动生成的边界信息

#### Scenario: 服务端返回错误
- **WHEN** 服务端返回 HTTP 非 2xx 或业务错误响应
- **THEN** 客户端抛出包含 HTTP 状态、业务错误码和服务端消息的错误对象

### Requirement: 文档 API 函数覆盖
客户端 SHALL 为开放 API 文档中的全部接口提供 TypeScript 函数入口，并按业务域分别放在 `api/` 目录下。

#### Scenario: 覆盖 OCR 服务
- **WHEN** 使用 OCR 客户端模块
- **THEN** 可以调用提交 OCR 任务和查询 OCR 结果的函数

#### Scenario: 覆盖临床前文本提取服务
- **WHEN** 使用临床前文本提取客户端模块
- **THEN** 可以调用提交文本提取任务和查询文本提取结果的函数

#### Scenario: 覆盖文献解析服务
- **WHEN** 使用文献解析客户端模块
- **THEN** 可以调用提交文献解析任务和查询文献解析结果的函数

#### Scenario: 覆盖同步搜索与查询服务
- **WHEN** 使用论文搜索、实体自动补全、药物搜索、HPA 或 GBD 客户端模块
- **THEN** 可以调用对应的搜索、健康检查或画像查询函数

#### Scenario: 覆盖靶点任务服务
- **WHEN** 使用靶点助手或靶点快速评估客户端模块
- **THEN** 可以调用提交任务和查询任务结果的函数

### Requirement: 异步任务轮询
客户端 SHALL 为异步任务服务提供可复用轮询能力，并为每个异步服务暴露一站式轮询函数。

#### Scenario: 轮询直到任务完成
- **WHEN** 调用轮询函数且服务端最终返回完成状态
- **THEN** 客户端返回完成结果并停止轮询

#### Scenario: 轮询遇到任务失败
- **WHEN** 调用轮询函数且服务端返回失败状态
- **THEN** 客户端抛出包含任务错误信息的异常并停止轮询

#### Scenario: 轮询超时
- **WHEN** 调用轮询函数且任务在超时时间内未完成
- **THEN** 客户端抛出超时错误并停止轮询

### Requirement: TypeScript 类型安全
客户端 SHALL 为公共响应、任务状态、请求参数和文档中列出的主要响应字段定义 TypeScript 类型，且实现代码 MUST NOT 使用 `any`。

#### Scenario: 调用方获得类型提示
- **WHEN** 调用方导入任意 API 函数
- **THEN** 函数参数和返回值具备 TypeScript 类型声明

#### Scenario: 表示未知扩展字段
- **WHEN** 服务端响应包含文档未列出的扩展字段
- **THEN** 类型使用 `unknown` 或 `Record<string, unknown>` 表示扩展数据而不是 `any`

### Requirement: 统一导出入口
客户端 SHALL 从 `api/index.ts` 导出所有公共 API 函数、公共配置能力和主要类型。

#### Scenario: 从统一入口导入函数
- **WHEN** 调用方从 `api/index.ts` 导入客户端函数
- **THEN** 可以访问全部开放 API 函数而无需了解内部文件布局

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
