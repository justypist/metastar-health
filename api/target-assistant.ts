import { requestOpenApi, requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import { OpenApiRequestError } from "./types.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { ApiSuccessResponse, PollOptions, TargetAssistantTaskStatus } from "./types.ts";

export type TargetAssistantLanguage = "zh-CN" | "en-US";

export interface TargetEntity {
  name: string;
  aliases?: string[];
}

export interface TargetAssistantSubmitParams {
  target?: string;
  targetEntity?: TargetEntity;
  language?: TargetAssistantLanguage;
}

export interface TargetAssistantSubmissionSuccess {
  success: true;
  taskId: string;
  message: string;
  validatedTarget?: TargetEntity;
}

export interface TargetAssistantSubmissionFailure {
  success: false;
  message: string;
}

export type TargetAssistantSubmission = TargetAssistantSubmissionSuccess | TargetAssistantSubmissionFailure;

export interface TargetAssistantTaskResult {
  taskId: string;
  status: TargetAssistantTaskStatus;
  progress: number;
  target?: string;
  pdfUrl?: string;
  reportUrl?: string;
  bulletJsonUrl?: string;
  referencesCsvUrl?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TargetAssistantPollOptions extends OpenApiRequestOptions, PollOptions {}

export interface TargetAssistantQaMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TargetAssistantReportQaParams {
  taskId: string;
  question: string;
  sessionId?: string;
  language?: TargetAssistantLanguage;
  history?: TargetAssistantQaMessage[];
}

export interface TargetAssistantCitation {
  id?: string;
  title?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  [key: string]: unknown;
}

export interface TargetAssistantReportQaResult {
  success: boolean;
  taskId: string;
  target?: string;
  scope: "full_task" | string;
  sessionId?: string;
  answer: string;
  citations?: TargetAssistantCitation[];
  [key: string]: unknown;
}

export type TargetAssistantRagModuleId =
  | "biology"
  | "disease"
  | "competition"
  | "preclinical"
  | "clinical"
  | "insights"
  | "supplementary"
  | string;

export interface TargetAssistantRagSearchParams {
  taskId: string;
  question: string;
  moduleId?: TargetAssistantRagModuleId;
  dataLimit?: number;
  reportLimit?: number;
}

export interface TargetAssistantRagItem {
  id: string;
  type: string;
  moduleId?: string;
  title?: string;
  content?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  evidenceGrade?: string;
  dataItemId?: string;
  isAIRecommended?: boolean;
  isSelected?: boolean;
  reportSectionId?: string;
  reportSlideId?: string;
  [key: string]: unknown;
}

export interface TargetAssistantRagSearchResult {
  success: boolean;
  taskId: string;
  target?: string;
  question: string;
  relatedData: TargetAssistantRagItem[];
  reportChunks: TargetAssistantRagItem[];
  [key: string]: unknown;
}

function assertTargetAssistantSubmitted(data: TargetAssistantSubmission): TargetAssistantSubmissionSuccess {
  if (!data.success) {
    throw new OpenApiRequestError({
      code: "TARGET_VALIDATION_FAILED",
      message: data.message,
      data,
    });
  }

  return data;
}

export async function submitTargetAssistantTask(
  params: TargetAssistantSubmitParams,
  options: OpenApiRequestOptions = {},
): Promise<TargetAssistantSubmissionSuccess> {
  const response = await requestOpenApi<ApiSuccessResponse<TargetAssistantSubmission>>("/api/target-assistant/submit", {
    ...options,
    method: "POST",
    body: params,
  });

  return assertTargetAssistantSubmitted(response.data);
}

export function getTargetAssistantResult(
  taskId: string,
  options: OpenApiRequestOptions = {},
): Promise<TargetAssistantTaskResult> {
  return requestOpenApiData<TargetAssistantTaskResult>(`/api/target-assistant/result/${encodeURIComponent(taskId)}`, options);
}

export function pollTargetAssistantResult(
  taskId: string,
  options: TargetAssistantPollOptions = {},
): Promise<TargetAssistantTaskResult> {
  return pollAsyncTask(() => getTargetAssistantResult(taskId, options), options);
}

export function askTargetAssistantReport(
  params: TargetAssistantReportQaParams,
  options: OpenApiRequestOptions = {},
): Promise<TargetAssistantReportQaResult> {
  return requestOpenApiData<TargetAssistantReportQaResult>("/api/target-assistant/report/qa", {
    ...options,
    method: "POST",
    body: params,
  });
}

export function searchTargetAssistantRag(
  params: TargetAssistantRagSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<TargetAssistantRagSearchResult> {
  return requestOpenApiData<TargetAssistantRagSearchResult>("/api/target-assistant/rag/search", {
    ...options,
    method: "POST",
    body: params,
  });
}
