## Context

项目当前是轻量 TypeScript ESM 客户端，`package.json` 只有 `pnpm check`，`tsconfig.json` 仅包含 `api/**/*.ts`，现有 `api/` 文件直接调用开放 API 请求封装、上传封装和轮询封装。用户明确要求为 `api/` 下每个文件添加测试用例，但不需要实际执行测试，避免产生业务数据。

## Goals / Non-Goals

**Goals:**
- 为 `api/` 下每个 TypeScript 文件建立对应测试覆盖，测试文件与源码一一对应或按模块职责清晰映射。
- 测试所有网络相关行为时只使用 fake fetch、模拟响应、内存文件对象和 fake timers，不访问真实开放 API。
- 覆盖请求方法、路径、查询参数、请求体、认证头、上传表单、响应解析、错误抛出、轮询状态和统一导出等关键行为。
- 保持实现代码无 `any`，测试代码同样避免 `any`。

**Non-Goals:**
- 不执行真实开放 API 请求、不上传真实文件、不创建或修改业务数据。
- 不改变开放 API 客户端的公共函数签名和运行时行为。
- 不引入端到端测试、集成测试环境或真实凭据管理。

## Decisions

- 使用 Node 内置 `node:test` 与 `node:assert/strict` 作为测试基础，而不是引入 Jest/Vitest。理由是当前项目依赖极少，内置测试能力足以覆盖纯函数、fetch mock 和 ESM 模块导出；替代方案是 Vitest，但会增加配置和依赖面。
- 将测试文件放在 `api/` 目录内并命名为 `<source>.test.ts`。理由是当前 `tsconfig.json` 已包含 `api/**/*.ts`，测试可被 `pnpm check` 类型检查覆盖；替代方案是放入独立 `tests/` 目录，但需要调整 include 并增加跨目录定位成本。
- 为请求类模块统一使用注入的 `fetch` 选项进行断言。理由是源码已经提供 `OpenApiClientOptions.fetch`，无需 monkey patch `globalThis.fetch`；替代方案是全局替换 fetch，但更容易污染其他测试。
- 对上传测试使用内存 `Blob`、`Uint8Array` 或临时 fixture，默认优先内存对象。理由是避免读写真实业务文件；路径文件分支若必须覆盖，应使用测试临时目录和非业务内容。
- 对轮询测试使用短间隔、受控时间或可中止信号，避免真实等待。理由是保证测试设计无副作用且可快速执行；替代方案是真实 `setTimeout` 等待，但会拖慢测试并增加不确定性。
- 后续实现阶段按用户要求不运行测试套件；仅允许运行 `pnpm check` 验证类型与编译约束。如需执行测试，应由用户手动运行。

## Risks / Trade-offs

- [Risk] Node 内置 TypeScript 执行能力与本地 Node 版本相关 → Mitigation：测试实现优先保证 `pnpm check` 通过，并在脚本中使用项目支持的 Node 版本能力或补充最小运行依赖。
- [Risk] 测试文件位于 `api/` 会被统一导出或生产使用误包含 → Mitigation：不从 `api/index.ts` 导出测试文件，测试文件只被测试脚本匹配。
- [Risk] 模块直接引用内部函数导致难以隔离 → Mitigation：优先通过公开函数与已存在的 `fetch`/options 注入点测试行为；只有必要时再做最小可测试性调整。
- [Risk] 轮询测试若使用真实计时可能变慢 → Mitigation：使用极短 timeout/interval、AbortController 或受控异步队列，避免长时间等待。
