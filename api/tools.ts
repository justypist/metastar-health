import { requestOpenApi, requestOpenApiData } from "./client.ts";
import { pollAsyncTask } from "./polling.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { EntityInput, GeneralTaskStatus, PollOptions } from "./types.ts";

export const openApiToolNames = [
  "preclinical_from_patent",
  "zhy_api_synapse_patent_core_search",
  "zhy_api_synapse_clinical_trial_search",
  "zhy_api_synapse_ct_result_search",
  "zhy_api_synapse_drug_deal_search",
  "zhy_api_synapse_target_analysis",
  "zhy_api_synapse_news_search",
  "search_pubmed",
  "search_medwatch",
  "search_trial",
  "search_patent",
  "search_engine",
  "search_review_combine",
  "search_conference_posters",
  "search_conference_presentations",
] as const;

export type OpenApiToolName = (typeof openApiToolNames)[number];
export type ToolExecutionStatus = "ok" | string;
export type SynapseSearchType = "keyword" | "drug" | "target" | "disease" | "organization" | "company" | string;
export type SearchEngineName = "google" | "bing" | "baidu" | "mita" | string;

export interface ToolExecutionResult<TData = unknown, TToolName extends string = OpenApiToolName> {
  toolName: TToolName;
  status: ToolExecutionStatus;
  data: TData;
  total?: number;
  truncated?: boolean;
  originalBytes?: number;
  [key: string]: unknown;
}

export interface ToolExecuteResponse<TData = unknown, TToolName extends string = OpenApiToolName> {
  data: ToolExecutionResult<TData, TToolName>;
  error: 0;
  message?: string;
  [key: string]: unknown;
}

export interface ToolSubmission {
  taskId: string;
  status: GeneralTaskStatus | string;
}

export interface ToolSubmissionResponse {
  data: ToolSubmission;
  error: 0;
  message?: string;
  [key: string]: unknown;
}

export interface ToolTaskResult<TData = unknown, TToolName extends string = OpenApiToolName> {
  taskId: string;
  toolName: TToolName;
  status: GeneralTaskStatus | "rate_limited" | string;
  progress?: number;
  result?: ToolExecutionResult<TData, TToolName>;
  error?: string | ToolTaskError;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ToolTaskError {
  code?: string;
  message?: string;
  details?: unknown;
  [key: string]: unknown;
}

export interface ToolPollOptions extends OpenApiRequestOptions, PollOptions {}

export interface SynapseKeywordSearchParams {
  keyword: string | string[];
  searchType?: SynapseSearchType;
  limit?: number;
}

export interface SynapseTargetAwareSearchParams extends SynapseKeywordSearchParams {
  targetAliases?: string[][];
  targetCondition?: string;
}

export interface TargetCompetitionSearchParams {
  keyword: string | string[];
  searchType?: "target" | "keyword" | string;
  targetAliases?: string[][];
}

export interface PreclinicalFromPatentSearchParams {
  patentNumbers?: string[];
  classifications?: string[];
  targets?: EntityInput[];
  diseases?: EntityInput[];
  drugs?: EntityInput[];
  companies?: EntityInput[];
  limit?: number;
}

export interface EntityCollectionSearchParams {
  targets?: EntityInput[];
  diseases?: EntityInput[];
  drugs?: EntityInput[];
  companies?: EntityInput[];
  limit?: number;
}

export interface TopicEntityCollectionSearchParams extends EntityCollectionSearchParams {
  topics?: string[];
}

export interface ReviewSearchParams {
  targets?: EntityInput[];
  diseases?: EntityInput[];
  topics?: string[];
  limit?: number;
}

export interface PubMedSearchParams {
  query: string;
  maxArticles?: number;
}

export interface WebSearchParams {
  query: string;
  engines?: SearchEngineName[];
  maxResults?: number;
}

export interface PatentPreclinicalData {
  data: Record<string, unknown>[];
  searchParams?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PatentCoreSearchData {
  patents: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export interface ClinicalTrialRegistrationSearchData {
  trials: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export interface ClinicalTrialResultSearchData {
  results: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export interface DrugDealSearchData {
  deals: Record<string, unknown>[];
  total?: number;
  [key: string]: unknown;
}

export interface TargetCompetitionData {
  competition?: Record<string, unknown>[];
  targetInfo?: Record<string, unknown>[];
  targetNames?: string[];
  summary?: Record<string, unknown>;
  total?: number;
  [key: string]: unknown;
}

export interface PharmaNewsSearchData {
  news: Record<string, unknown>[];
  total?: number;
  searchType?: string;
  keyword?: string | string[];
  [key: string]: unknown;
}

export interface PubMedSearchData {
  articles: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface WebSearchData {
  query: string;
  results: Array<{
    engine: string;
    data: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function buildToolPath(toolName: string, action: "execute" | "submit"): string {
  return `/api/v1/tools/${encodeURIComponent(toolName)}/${action}`;
}

export function executeTool<TData = unknown, TToolName extends OpenApiToolName = OpenApiToolName>(
  toolName: TToolName,
  params: unknown,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<TData, TToolName>> {
  return requestOpenApi<ToolExecuteResponse<TData, TToolName>>(buildToolPath(toolName, "execute"), {
    ...options,
    method: "POST",
    body: params,
  });
}

export function submitToolTask(
  toolName: OpenApiToolName,
  params: unknown,
  options: OpenApiRequestOptions = {},
): Promise<ToolSubmission> {
  return requestOpenApiData<ToolSubmission>(buildToolPath(toolName, "submit"), {
    ...options,
    method: "POST",
    body: params,
  });
}

export function getToolTaskResult<TData = unknown, TToolName extends OpenApiToolName = OpenApiToolName>(
  taskId: string,
  options: OpenApiRequestOptions = {},
): Promise<ToolTaskResult<TData, TToolName>> {
  return requestOpenApiData<ToolTaskResult<TData, TToolName>>(`/api/v1/tools/tasks/${encodeURIComponent(taskId)}`, options);
}

export function pollToolTaskResult<TData = unknown, TToolName extends OpenApiToolName = OpenApiToolName>(
  taskId: string,
  options: ToolPollOptions = {},
): Promise<ToolTaskResult<TData, TToolName>> {
  return pollAsyncTask(() => getToolTaskResult<TData, TToolName>(taskId, options), options);
}

export function searchPreclinicalFromPatent(
  params: PreclinicalFromPatentSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<PatentPreclinicalData, "preclinical_from_patent">> {
  return executeTool("preclinical_from_patent", params, options);
}

export function searchPatentCore(
  params: SynapseKeywordSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<PatentCoreSearchData, "zhy_api_synapse_patent_core_search">> {
  return executeTool("zhy_api_synapse_patent_core_search", params, options);
}

export function searchClinicalTrialRegistrations(
  params: SynapseKeywordSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<ClinicalTrialRegistrationSearchData, "zhy_api_synapse_clinical_trial_search">> {
  return executeTool("zhy_api_synapse_clinical_trial_search", params, options);
}

export function searchClinicalTrialResults(
  params: SynapseKeywordSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<ClinicalTrialResultSearchData, "zhy_api_synapse_ct_result_search">> {
  return executeTool("zhy_api_synapse_ct_result_search", params, options);
}

export function searchDrugDeals(
  params: SynapseKeywordSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<DrugDealSearchData, "zhy_api_synapse_drug_deal_search">> {
  return executeTool("zhy_api_synapse_drug_deal_search", params, options);
}

export function analyzeTargetCompetition(
  params: TargetCompetitionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<TargetCompetitionData, "zhy_api_synapse_target_analysis">> {
  return executeTool("zhy_api_synapse_target_analysis", params, options);
}

export function searchPharmaNews(
  params: SynapseTargetAwareSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<PharmaNewsSearchData, "zhy_api_synapse_news_search">> {
  return executeTool("zhy_api_synapse_news_search", params, options);
}

export function searchPubMed(
  params: PubMedSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<PubMedSearchData, "search_pubmed">> {
  return executeTool("search_pubmed", params, options);
}

export function searchMedwatch(
  params: TopicEntityCollectionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_medwatch">> {
  return executeTool("search_medwatch", params, options);
}

export function searchClinicalTrials(
  params: EntityCollectionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_trial">> {
  return executeTool("search_trial", params, options);
}

export function searchPatents(
  params: EntityCollectionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_patent">> {
  return executeTool("search_patent", params, options);
}

export function searchWeb(
  params: WebSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<WebSearchData, "search_engine">> {
  return executeTool("search_engine", params, options);
}

export function searchReviewLiterature(
  params: ReviewSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_review_combine">> {
  return executeTool("search_review_combine", params, options);
}

export function searchConferencePosters(
  params: EntityCollectionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_conference_posters">> {
  return executeTool("search_conference_posters", params, options);
}

export function searchConferencePresentations(
  params: EntityCollectionSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<ToolExecuteResponse<Record<string, unknown>[], "search_conference_presentations">> {
  return executeTool("search_conference_presentations", params, options);
}
