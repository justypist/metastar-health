import { requestOpenApi, requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { ApiSuccessResponse, GeneralTaskStatus, PollOptions, TaskSubmission } from "./types.ts";

export interface TargetQuickAssessmentSubmitParams {
  targetNames: string[];
}

export interface TargetQuickAssessmentReport {
  reportContent: string;
  [key: string]: unknown;
}

export interface TargetQuickAssessmentTargetResult {
  target: string;
  status: GeneralTaskStatus;
  progress: number;
  result?: TargetQuickAssessmentReport;
  error?: string;
  [key: string]: unknown;
}

export interface TargetQuickAssessmentTaskResult {
  taskId: string;
  status: GeneralTaskStatus;
  progress: number;
  completedCount: number;
  totalCount: number;
  targets: TargetQuickAssessmentTargetResult[];
  createdAt?: string;
  updatedAt?: string;
  error?: string;
  [key: string]: unknown;
}

export interface TargetQuickAssessmentPollOptions extends OpenApiRequestOptions, PollOptions {}

export async function submitTargetQuickAssessmentTask(
  params: TargetQuickAssessmentSubmitParams,
  options: OpenApiRequestOptions = {},
): Promise<TaskSubmission> {
  const response = await requestOpenApi<ApiSuccessResponse<TaskSubmission>>("/api/target-quick-assessment/submit", {
    ...options,
    method: "POST",
    body: params,
  });

  return response.data;
}

export function getTargetQuickAssessmentResult(
  taskId: string,
  options: OpenApiRequestOptions = {},
): Promise<TargetQuickAssessmentTaskResult> {
  return requestOpenApiData<TargetQuickAssessmentTaskResult>(
    `/api/target-quick-assessment/result/${encodeURIComponent(taskId)}`,
    options,
  );
}

export function pollTargetQuickAssessmentResult(
  taskId: string,
  options: TargetQuickAssessmentPollOptions = {},
): Promise<TargetQuickAssessmentTaskResult> {
  return pollAsyncTask(() => getTargetQuickAssessmentResult(taskId, options), options);
}
