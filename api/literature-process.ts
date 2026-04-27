import { requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import { requestOpenApiUpload } from "./upload.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { OpenApiUploadRequestOptions } from "./upload.ts";
import type { ApiSuccessResponse, FileInput, GeneralTaskStatus, PollOptions, TaskSubmission } from "./types.ts";

export interface LiteratureFullText {
  title?: string[];
  ABSTRACT?: string[];
  INTRODUCTION?: string[];
  METHODS?: string[];
  RESULTS?: string[];
  DISCUSSION?: string[];
  CONCLUSION?: string[];
  REFERENCES?: string[];
  [section: string]: unknown;
}

export interface LiteratureModel {
  model_id: string;
  model_name: string;
  model_type: string;
  model_purpose?: string;
  extracted_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LiteratureImageInfo {
  type: "image" | "table" | string;
  img_path?: string;
  image_caption?: string[];
  image_footnote?: string[];
  table_caption?: string[];
  table_body?: string;
  page_idx: number;
  [key: string]: unknown;
}

export interface LiteratureProcessResult {
  PMID: string;
  fulltext: LiteratureFullText;
  models: LiteratureModel[];
  image_info: LiteratureImageInfo[];
  [key: string]: unknown;
}

export interface LiteratureProcessTaskResult {
  taskId: string;
  status: GeneralTaskStatus;
  progress: number;
  result?: LiteratureProcessResult;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiteratureProcessPollOptions extends OpenApiRequestOptions, PollOptions {}

export async function submitLiteratureProcessTask(
  file: FileInput,
  options: OpenApiUploadRequestOptions = {},
): Promise<TaskSubmission> {
  const response = await requestOpenApiUpload<ApiSuccessResponse<TaskSubmission>>(
    "/api/literature-process/submit",
    file,
    options,
  );

  return response.data;
}

export function getLiteratureProcessResult(
  taskId: string,
  options: OpenApiRequestOptions = {},
): Promise<LiteratureProcessTaskResult> {
  return requestOpenApiData<LiteratureProcessTaskResult>(`/api/literature-process/result/${encodeURIComponent(taskId)}`, options);
}

export function pollLiteratureProcessResult(
  taskId: string,
  options: LiteratureProcessPollOptions = {},
): Promise<LiteratureProcessTaskResult> {
  return pollAsyncTask(() => getLiteratureProcessResult(taskId, options), options);
}
