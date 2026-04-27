import { readOpenApiConfig } from "./config.ts";
import { OpenApiRequestError } from "./types.ts";
import type { ApiErrorCode, OpenApiClientOptions, OpenApiFetch } from "./types.ts";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParamValue = QueryValue | QueryValue[];
export type QueryParams = Record<string, QueryParamValue>;

export interface OpenApiRequestOptions extends OpenApiClientOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

function getFetch(fetchOverride?: OpenApiFetch): OpenApiFetch {
  const resolvedFetch = fetchOverride ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error("No fetch implementation available for open API requests.");
  }

  return resolvedFetch.bind(globalThis) as OpenApiFetch;
}

function appendQuery(url: URL, query: QueryParams = {}): void {
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (item !== undefined && item !== null) {
        url.searchParams.append(key, String(item));
      }
    }
  }
}

export function buildOpenApiUrl(baseUrl: string, path: string, query?: QueryParams): URL {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);

  appendQuery(url, query);

  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readApiErrorCode(payload: unknown): ApiErrorCode | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const error = payload.error;
  return typeof error === "number" || typeof error === "string" ? error : undefined;
}

function readApiMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.message === "string" ? payload.message : undefined;
}

function readApiData(payload: unknown): unknown {
  return isRecord(payload) ? payload.data : undefined;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return text;
  }

  return JSON.parse(text) as unknown;
}

function assertSuccessfulResponse(response: Response, payload: unknown): void {
  const code = readApiErrorCode(payload);
  const message = readApiMessage(payload);
  const data = readApiData(payload);

  if (!response.ok || (code !== undefined && code !== 0)) {
    throw new OpenApiRequestError({
      status: response.status,
      statusText: response.statusText,
      code,
      message: message ?? response.statusText,
      response: payload,
      data,
    });
  }
}

export async function requestOpenApi<TResponse>(path: string, options: OpenApiRequestOptions = {}): Promise<TResponse> {
  const config = readOpenApiConfig(options);
  const fetchImpl = getFetch(options.fetch);
  const url = buildOpenApiUrl(config.baseUrl, path, options.query);
  const headers = new Headers(options.headers);

  headers.set("x-app-key", config.appKey);
  headers.set("x-app-secret", config.appSecret);

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetchImpl(url, {
    method: options.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    signal: options.signal,
  });
  const payload = await parseResponsePayload(response);

  assertSuccessfulResponse(response, payload);

  return payload as TResponse;
}

export async function requestOpenApiData<TData>(path: string, options: OpenApiRequestOptions = {}): Promise<TData> {
  const payload = await requestOpenApi<{ data: TData }>(path, options);

  return payload.data;
}
