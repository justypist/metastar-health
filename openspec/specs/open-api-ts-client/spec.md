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
