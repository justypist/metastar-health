# 文档处理 API

覆盖 OCR、临床前文本提取和文献解析。

所有函数都从 `api/index.ts` 导入。文档处理会上传文件并创建远端异步任务，只有用户明确提供文件和授权调用时才能执行。

## 函数清单

- OCR：`submitOcrTask(file, options?)`、`getOcrResult(taskId, options?)`、`pollOcrResult(taskId, options?)`。
- 临床前文本提取：`submitTextExtractionTask(file, options?)`、`getTextExtractionResult(taskId, options?)`、`pollTextExtractionResult(taskId, options?)`。
- 文献解析：`submitLiteratureProcessTask(file, options?)`、`getLiteratureProcessResult(taskId, options?)`、`pollLiteratureProcessResult(taskId, options?)`。

## submit / result / poll 选择

- `submit*Task`：上传文件并创建远端任务，返回 `{ taskId }`。这是有真实副作用的操作。
- `get*Result`：按 `taskId` 查询当前任务状态，不主动等待。
- `poll*Result`：循环调用 `get*Result` 直到完成、失败或超时。

默认轮询约定来自 `pollAsyncTask`：`intervalMs` 默认为 5000，`timeoutMs` 默认为 600000；`completed` 视为成功，`failed` 会抛出 `OpenApiRequestError`。可传入 `signal` 取消轮询。

```ts
import { pollOcrResult, submitOcrTask } from "./api/index.ts";

// 仅在用户明确提供文件并授权上传后手动调用。
const submission = await submitOcrTask({ data: fileBytes, filename: "document.pdf" });
const task = await pollOcrResult(submission.taskId, { intervalMs: 5000, timeoutMs: 600000 });
```

## OCR

适用于将文档转为可下载识别结果。

输入与选项：

- `file: FileInput`：可以是本地路径、URL、Blob、File、ArrayBuffer、Uint8Array 或 `{ data, filename, contentType }`。
- `options?: OpenApiUploadRequestOptions`：可传认证、base URL、上传字段名、文件名、content type 或 fetch 覆盖。

状态与返回：

- `submitOcrTask` 返回 `TaskSubmission`，核心字段为 `taskId`。
- `getOcrResult` 和 `pollOcrResult` 返回 `OcrTaskResult`，包含 `status`、`progress`、`error`、`createdAt`、`updatedAt`。
- 完成后 `result` 包含 `downloadUrl`、`filename` 和 `size`。

## 临床前文本提取

适用于从论文或文档中抽取动物模型、细胞模型及质量检查信息。

输入与选项：

- `submitTextExtractionTask(file, options?)` 使用同一 `FileInput` 上传约定。
- `getTextExtractionResult(taskId, options?)` 查询状态。
- `pollTextExtractionResult(taskId, options?)` 等待完成。

状态与返回：

- `TextExtractionTaskResult.status` 为 `pending`、`processing`、`completed` 或 `failed`。
- 完成后 `result` 为 `TextExtractionDocumentResult[]`。
- 单篇结果包含 `success`、`pmid`、`title`、`model_names`、`models` 和 `processing_summary`。
- 模型字段包含 `model_id`、`model_name`、`model_type`、`model_purpose`、`extracted_fields` 和 `quality_check`。

## 文献解析

适用于解析全文结构、实验模型和图片/表格信息。

输入与选项：

- `submitLiteratureProcessTask(file, options?)` 使用同一 `FileInput` 上传约定。
- `getLiteratureProcessResult(taskId, options?)` 查询状态。
- `pollLiteratureProcessResult(taskId, options?)` 等待完成。

状态与返回：

- `LiteratureProcessTaskResult.status` 为 `pending`、`processing`、`completed` 或 `failed`。
- 完成后 `result` 包含 `PMID`、`fulltext`、`models` 和 `image_info`。
- `fulltext` 按章节组织，常见字段包括 `ABSTRACT`、`INTRODUCTION`、`METHODS`、`RESULTS`、`DISCUSSION`、`CONCLUSION` 和 `REFERENCES`。
- `models` 包含 `model_id`、`model_name`、`model_type`、`model_purpose` 和 `extracted_fields`。
- `image_info` 描述图片或表格，包含 `type`、`page_idx`、caption、footnote 或表格正文。

## 失败处理

- 如果 `get*Result` 返回 `failed`，读取 `error` 字段向用户说明失败原因。
- 如果 `poll*Result` 抛出 `TASK_FAILED`，错误对象的 `data` 包含最后一次任务状态。
- 如果轮询超时，错误码为 `POLL_TIMEOUT`；不要无限重试，应询问用户是否继续等待或改用单次查询。
