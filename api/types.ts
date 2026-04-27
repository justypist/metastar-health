export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export type ApiErrorCode = number | string;

export interface ApiSuccessResponse<TData> {
  data: TData;
  error: 0;
  message?: string;
  query?: unknown;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  data?: unknown;
  error?: ApiErrorCode;
  message?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export interface OpenApiErrorDetails {
  status?: number;
  statusText?: string;
  code?: ApiErrorCode;
  message?: string;
  response?: unknown;
  data?: unknown;
}

export class OpenApiRequestError extends Error {
  readonly status?: number;
  readonly statusText?: string;
  readonly code?: ApiErrorCode;
  readonly response?: unknown;
  readonly data?: unknown;

  constructor(details: OpenApiErrorDetails) {
    super(details.message ?? "Open API request failed.");
    this.name = "OpenApiRequestError";
    this.status = details.status;
    this.statusText = details.statusText;
    this.code = details.code;
    this.response = details.response;
    this.data = details.data;
  }
}

export type OpenApiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface OpenApiClientOptions {
  appKey?: string;
  appSecret?: string;
  baseUrl?: string;
  fetch?: OpenApiFetch;
}

export type GeneralTaskStatus = "pending" | "processing" | "completed" | "failed";
export type TargetAssistantTaskStatus = "researching" | "generating_report" | "generating_pdf" | "completed" | "failed";
export type AsyncTaskStatus = GeneralTaskStatus | TargetAssistantTaskStatus;

export interface TaskSubmission {
  taskId: string;
}

export interface AsyncTaskBase<TStatus extends string = AsyncTaskStatus, TResult = unknown> {
  taskId: string;
  status: TStatus;
  progress?: number;
  result?: TResult;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EntityInput {
  name: string;
  aliases?: string[] | string;
  [key: string]: unknown;
}

export type EntityType = "disease" | "target" | "drug" | "company";

export interface AutocompleteEntity {
  name: string;
  type: EntityType | string;
  aliases: string;
  _score: number;
  highest_status: string | null;
  highest_status_sort: number | null;
  [key: string]: unknown;
}

export type BinaryFileData = Blob | File | ArrayBuffer | Uint8Array;

export interface NamedFileData {
  data: BinaryFileData;
  filename?: string;
  contentType?: string;
}

export type FileInput = string | URL | BinaryFileData | NamedFileData;

export interface UploadFileOptions {
  fieldName?: string;
  filename?: string;
  contentType?: string;
}

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}
