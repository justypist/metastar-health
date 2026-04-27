import { requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import { requestOpenApiUpload } from "./upload.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { OpenApiUploadRequestOptions } from "./upload.ts";
import type { ApiSuccessResponse, FileInput, GeneralTaskStatus, PollOptions, TaskSubmission } from "./types.ts";

export interface OcrDownloadResult {
  downloadUrl: string;
  filename: string;
  size: number;
}

export interface OcrTaskResult {
  taskId: string;
  status: GeneralTaskStatus;
  progress: number;
  result?: OcrDownloadResult;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OcrPollOptions extends OpenApiRequestOptions, PollOptions {}

export async function submitOcrTask(file: FileInput, options: OpenApiUploadRequestOptions = {}): Promise<TaskSubmission> {
  const response = await requestOpenApiUpload<ApiSuccessResponse<TaskSubmission>>("/api/ocr/submit", file, options);

  return response.data;
}

export function getOcrResult(taskId: string, options: OpenApiRequestOptions = {}): Promise<OcrTaskResult> {
  return requestOpenApiData<OcrTaskResult>(`/api/ocr/result/${encodeURIComponent(taskId)}`, options);
}

export function pollOcrResult(taskId: string, options: OcrPollOptions = {}): Promise<OcrTaskResult> {
  return pollAsyncTask(() => getOcrResult(taskId, options), options);
}
