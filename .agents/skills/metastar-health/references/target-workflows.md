# 靶点工作流 API

覆盖靶点助手和靶点快速评估。

靶点工作流会创建远端异步任务，只有用户明确给出靶点并授权调用时才能执行。

## 函数清单

- 靶点助手：`submitTargetAssistantTask(params, options?)`、`getTargetAssistantResult(taskId, options?)`、`pollTargetAssistantResult(taskId, options?)`、`askTargetAssistantReport(params, options?)`、`searchTargetAssistantRag(params, options?)`。
- 靶点快速评估：`submitTargetQuickAssessmentTask(params, options?)`、`getTargetQuickAssessmentResult(taskId, options?)`、`pollTargetQuickAssessmentResult(taskId, options?)`。

## 通用状态流转

- submit 函数创建任务并返回 `taskId`，这是有真实远端副作用的操作。
- get 函数按 `taskId` 查询当前状态，不等待完成。
- poll 函数按 `intervalMs` 循环查询，直到完成、失败或超过 `timeoutMs`。
- 失败状态会抛出或返回包含 `error` 的任务结果；向用户说明失败原因前应保留 `taskId` 便于后续排查。

```ts
// 仅在用户明确提供靶点并授权创建远端任务后手动调用。
const submission = await submitTargetAssistantTask({ target: "EGFR", language: "zh-CN" });
const task = await pollTargetAssistantResult(submission.taskId, { intervalMs: 5000, timeoutMs: 900000 });
```

## 靶点助手

适用于围绕单个靶点完成数据采集/筛选，并可选生成平台报告。

输入约束：

- `target?: string`：靶点名。
- `targetEntity?: { name: string; aliases?: string[] }`：已补全或验证的靶点实体。
- `language?: "zh-CN" | "en-US"`：报告语言。
- `generateReport?: boolean`：是否由平台生成 HTML/PDF/JSON/CSV 报告产物，默认 `false`。默认模式只完成数据采集/筛选，完成后优先调用 RAG 接口拿上下文。
- `target` 与 `targetEntity` 至少提供一个；如果用户给的是模糊名称，建议先使用实体补全资源确认名称和别名。

提交结果：

- 成功时返回 `TargetAssistantSubmissionSuccess`，包含 `success: true`、`taskId`、`message`、可选 `generateReport` 和可选 `validatedTarget`。
- 如果远端返回 `success: false`，封装函数会抛出 `OpenApiRequestError`，错误码为 `TARGET_VALIDATION_FAILED`。

任务结果：

- `status` 可能为 `researching`、`generating_report`、`generating_pdf`、`completed` 或 `failed`。默认 `generateReport=false` 时通常从 `researching` 直接到 `completed`。
- `progress` 表示任务进度。
- 完成后可读取 `target` 和 `generateReport`。只有提交时 `generateReport=true`，完成态才可能返回 `pdfUrl`、`reportUrl`、`bulletJsonUrl` 和 `referencesCsvUrl`。
- 失败时读取 `error` 字段，并向用户说明可修改靶点名称或稍后重试。

报告扩展能力：

- `askTargetAssistantReport` 对已完成且已生成平台报告的任务做 QA，参数包含 `taskId`、`question`、可选 `sessionId`、`language` 和短 `history`。返回 Markdown `answer`、`sessionId` 和 `citations`。如果任务使用默认 `generateReport=false`，改用 RAG 接口拿上下文后在调用方生成回答。
- `searchTargetAssistantRag` 只召回上下文，不生成回答。参数包含 `taskId`、`question`、可选 `moduleId`、`dataLimit`、`reportLimit` 和 `includeAllFulltextChunks`，返回 `relatedData`、`reportChunks` 和可选 `total`。
- RAG 的 `relatedData[]` 在文献型模块中可能包含 `fulltextAttachment` 和 `attachedFulltextChunks`。`includeAllFulltextChunks=false` 时服务端返回排序/筛选后的相关全文片段；设为 `true` 时返回对应 PMID 的全部可用全文 chunks，由调用方自行排序。
- RAG 接口要求靶点助手任务已完成；如果任务仍在 `researching`、`generating_report` 或 `generating_pdf`，先继续轮询。默认 `generateReport=false` 的完成任务也可以调用 RAG，此时 `reportChunks` 通常为空，但 `relatedData` 和全文证据片段仍可用于外部 RAG 编排。

## 靶点快速评估

适用于批量提交多个靶点并获取简短评估报告。

输入约束：

- `targetNames: string[]`：待评估靶点名称数组，必填。
- 传入前应去重、移除空字符串，并确保每个名称来自用户输入或明确的上游实体识别结果。
- 批量过大时建议先询问用户是否拆分，避免一次远端任务过重。

任务结果：

- 顶层 `status` 为 `pending`、`processing`、`completed` 或 `failed`。
- `progress` 表示整体进度。
- `completedCount` 与 `totalCount` 表示批量完成数量。
- `targets` 按靶点列出子结果，每个子结果包含 `target`、`status`、`progress`、`result` 和 `error`。
- 单个靶点完成后，`result.reportContent` 包含评估报告正文。

## 结果处理建议

- 如果整体任务未完成但部分 `targets` 已有结果，可先向用户说明部分完成状态，不要伪造成完整报告。
- 如果单个靶点失败但整体任务继续，保留成功靶点报告，并列出失败靶点及 `error`。
- 对 `pdfUrl`、`reportUrl` 或 `reportContent` 只做展示或摘要；不要假设链接永久有效。
