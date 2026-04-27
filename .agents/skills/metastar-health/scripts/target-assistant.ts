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
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TargetAssistantPollOptions extends OpenApiRequestOptions, PollOptions {}

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
