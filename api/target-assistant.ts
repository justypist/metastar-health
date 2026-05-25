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
  generateReport?: boolean;
}

export interface TargetAssistantSubmissionSuccess {
  success: true;
  taskId: string;
  message: string;
  generateReport?: boolean;
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
  generateReport?: boolean;
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
  includeAllFulltextChunks?: boolean;
}

export type TargetAssistantFulltextAttachmentStatus =
  | "matched"
  | "unmatched"
  | "no_identifier"
  | "not_applicable"
  | "skipped"
  | "error";

export type TargetAssistantFulltextSectionType =
  | "results"
  | "figure"
  | "table"
  | "evidence_body"
  | "abstract"
  | "methods"
  | "discussion"
  | "intro"
  | "other";

export type TargetAssistantFulltextChunkType = "fulltext" | "figure" | "table" | "other";

export interface TargetAssistantFulltextAttachment {
  status: TargetAssistantFulltextAttachmentStatus | string;
  pmid?: string;
  sourceIndexes?: string[];
  chunkCount?: number;
  attachedChunkCount?: number;
  hasFigures?: boolean;
  hasTables?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface TargetAssistantFulltextChunk {
  chunkId: string;
  sourceIndex?: string;
  parentPmid?: string;
  sectionKey?: string;
  sectionType?: TargetAssistantFulltextSectionType | string;
  chunkType?: TargetAssistantFulltextChunkType | string;
  order?: number;
  content: string;
  [key: string]: unknown;
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
  fulltextAttachment?: TargetAssistantFulltextAttachment;
  attachedFulltextChunks?: TargetAssistantFulltextChunk[];
  [key: string]: unknown;
}

export interface TargetAssistantRagSearchTotal {
  relatedData?: number;
  reportChunks?: number;
  [key: string]: unknown;
}

export interface TargetAssistantRagSearchResult {
  success: boolean;
  taskId: string;
  target?: string;
  question: string;
  relatedData: TargetAssistantRagItem[];
  reportChunks: TargetAssistantRagItem[];
  total?: TargetAssistantRagSearchTotal;
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
