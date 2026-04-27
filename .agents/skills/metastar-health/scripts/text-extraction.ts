import { requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import { requestOpenApiUpload } from "./upload.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { OpenApiUploadRequestOptions } from "./upload.ts";
import type { ApiSuccessResponse, FileInput, GeneralTaskStatus, PollOptions, TaskSubmission } from "./types.ts";

export type PreclinicalModelType = "animal_model" | "cell_model" | string;

export interface PreclinicalModelName {
  model_id: string;
  model_type: PreclinicalModelType;
  model_name: string;
  brief_description?: string;
}

export interface PreclinicalModel {
  model_id: string;
  model_name: string;
  model_type: PreclinicalModelType;
  model_purpose?: string;
  brief_description?: string;
  extracted_fields?: Record<string, unknown>;
  quality_check?: Record<string, unknown>;
}

export interface PreclinicalProcessingSummary {
  total_models: number;
  animal_models: number;
  cell_models: number;
  [key: string]: unknown;
}

export interface TextExtractionDocumentResult {
  success: boolean;
  pmid: string;
  title: string;
  model_names?: PreclinicalModelName[];
  models?: PreclinicalModel[];
  processing_summary?: PreclinicalProcessingSummary;
  [key: string]: unknown;
}

export interface TextExtractionTaskResult {
  taskId: string;
  status: GeneralTaskStatus;
  progress: number;
  result?: TextExtractionDocumentResult[];
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TextExtractionPollOptions extends OpenApiRequestOptions, PollOptions {}

export async function submitTextExtractionTask(
  file: FileInput,
  options: OpenApiUploadRequestOptions = {},
): Promise<TaskSubmission> {
  const response = await requestOpenApiUpload<ApiSuccessResponse<TaskSubmission>>(
    "/api/text-extraction/submit",
    file,
    options,
  );

  return response.data;
}

export function getTextExtractionResult(
  taskId: string,
  options: OpenApiRequestOptions = {},
): Promise<TextExtractionTaskResult> {
  return requestOpenApiData<TextExtractionTaskResult>(`/api/text-extraction/result/${encodeURIComponent(taskId)}`, options);
}

export function pollTextExtractionResult(
  taskId: string,
  options: TextExtractionPollOptions = {},
): Promise<TextExtractionTaskResult> {
  return pollAsyncTask(() => getTextExtractionResult(taskId, options), options);
}
