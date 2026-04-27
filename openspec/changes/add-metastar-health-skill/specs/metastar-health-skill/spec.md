## ADDED Requirements

### Requirement: SKILL 入口定义
系统 SHALL 提供名为 `metastar-health` 的 SKILL 入口文件，入口文件 SHALL 包含有效 frontmatter、简洁能力说明、使用约束和按需资源索引。

#### Scenario: 技能可被识别
- **WHEN** 查看 `.agents/skills/metastar-health/SKILL.md`
- **THEN** 文件包含 `name: metastar-health` 和面向 agent 的 `description` frontmatter 字段

#### Scenario: 入口保持精简
- **WHEN** agent 加载 `metastar-health` SKILL
- **THEN** 入口只提供能力总览、认证提醒和资源导航，不一次性包含全部 API 参数、返回字段和完整示例

### Requirement: Description 基于可用 API 生成
系统 SHALL 根据 `api/index.ts` 中实际导出的开放 API 模块生成或校验 `metastar-health` SKILL 的 `description`，并且生成内容 SHALL 覆盖当前可用 API 的主要能力类别。

#### Scenario: 根据导出模块生成描述
- **WHEN** 运行 SKILL 生成脚本且 `api/index.ts` 导出 OCR、文本提取、文献解析、论文搜索、实体补全、靶点、药物、HPA 和 GBD 模块
- **THEN** 生成的 `description` 提及这些能力类别对应的 agent 使用场景

#### Scenario: 不声明不可用能力
- **WHEN** 某个 API 模块未从 `api/index.ts` 导出
- **THEN** 生成的 `description` 和 API 能力表不声明该模块对应能力

#### Scenario: 校验发现描述过期
- **WHEN** `SKILL.md` 中的生成描述与当前 `api/index.ts` 导出不一致并运行校验模式
- **THEN** 校验失败并输出可读错误，提示重新生成 SKILL 元数据

### Requirement: 分层资源文档
`metastar-health` SKILL SHALL 将 API 使用方式拆分为按需加载的资源文档，资源文档 SHALL 按业务意图和调用模式组织，而不是把全部 API 说明放入入口文件。

#### Scenario: 同步查询资源可按需加载
- **WHEN** agent 需要执行论文搜索、实体补全、药物搜索、HPA 靶点画像或 GBD 疾病负担查询
- **THEN** SKILL 入口指向同步查询资源文档，该文档包含对应函数、关键参数、返回结构和适用场景

#### Scenario: 文档处理资源可按需加载
- **WHEN** agent 需要执行 OCR、临床前文本提取或文献解析
- **THEN** SKILL 入口指向文档处理资源文档，该文档说明提交任务、查询结果和轮询函数的选择方式

#### Scenario: 靶点工作流资源可按需加载
- **WHEN** agent 需要执行靶点助手研究或批量靶点快速评估
- **THEN** SKILL 入口指向靶点工作流资源文档，该文档说明输入约束、异步状态和结果字段

### Requirement: API 能力表与客户端导出一致
系统 SHALL 提供 `metastar-health` SKILL 的 API 能力表，列出每个业务域对应的 TypeScript 函数入口，并通过校验保护其与 `api/` 公共导出的一致性。

#### Scenario: 能力表覆盖所有公共 API 模块
- **WHEN** 查看生成的 API 能力表
- **THEN** 表中包含 `autocomplete`、`drugs`、`gbd`、`hpa`、`literature-process`、`ocr`、`papers`、`target-assistant`、`target-quick-assessment` 和 `text-extraction` 业务模块

#### Scenario: 能力表列出函数入口
- **WHEN** agent 根据能力表选择 API
- **THEN** 能看到每个业务模块对应的公共函数名和应从 `api/index.ts` 导入的约定

#### Scenario: 公共请求工具不作为业务能力暴露
- **WHEN** 生成 API 能力表
- **THEN** `client`、`config`、`polling`、`types` 和 `upload` 等公共基础模块只作为使用说明或辅助能力出现，不被描述为独立业务 API 场景

### Requirement: 安全与副作用约束
`metastar-health` SKILL SHALL 明确要求 agent 使用环境变量或调用方传入配置处理认证，并且 MUST NOT 在示例、文档或自动化校验中包含真实凭据、真实业务文件或默认发起真实开放 API 请求。

#### Scenario: 文档不包含真实凭据
- **WHEN** 查看 SKILL 入口和资源文档
- **THEN** 只出现 `APP_KEY`、`APP_SECRET`、`OPEN_API_BASE_URL` 或占位值，不出现真实 app key 或 app secret

#### Scenario: 示例避免导入即执行
- **WHEN** 资源文档展示调用示例
- **THEN** 示例说明必须由用户准备环境变量和输入后手动调用，不要求在导入 SKILL 或运行校验时访问真实网络

#### Scenario: 异步任务提醒轮询约束
- **WHEN** 资源文档描述异步任务 API
- **THEN** 文档说明 submit、result 和 poll 函数的区别，并提醒轮询间隔、超时和失败状态处理

### Requirement: 自动化验证
系统 SHALL 提供自动化验证，确保 SKILL 元数据生成逻辑、资源文档结构和 API 能力表在实现后可被持续检查。

#### Scenario: 生成逻辑被测试覆盖
- **WHEN** 执行项目自动化测试
- **THEN** 测试覆盖 API 导出扫描、description 生成、能力表生成和校验失败路径

#### Scenario: 静态类型检查通过
- **WHEN** 执行项目静态类型检查
- **THEN** 新增生成脚本和测试不产生 TypeScript 错误，且实现代码不使用 `any`

#### Scenario: 自动化测试无真实业务副作用
- **WHEN** 执行新增测试或校验脚本
- **THEN** 测试不调用真实开放 API、不上传真实文件、不创建远端异步任务
