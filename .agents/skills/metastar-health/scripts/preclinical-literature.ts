import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { EntityInput } from "./types.ts";

export interface PreclinicalLiteratureSearchParams {
  targets?: EntityInput[];
  diseases?: EntityInput[];
  companies?: EntityInput[];
  limit?: number;
}

export interface PreclinicalLiteratureRecord {
  ID?: string;
  PMID?: string;
  title?: string;
  abstract?: string;
  Target?: string;
  Disease?: string;
  Company?: string;
  model_info?: unknown[];
  image_info?: unknown[];
  [key: string]: unknown;
}

export interface PreclinicalLiteratureSearchData {
  status: "completed" | string;
  progress: number;
  result: PreclinicalLiteratureRecord[];
  total: number;
  limit: number;
}

export interface NormalizedPreclinicalLiteratureSearchQuery {
  targets: EntityInput[];
  diseases: EntityInput[];
  companies: EntityInput[];
  limit: number;
}

export interface PreclinicalLiteratureSearchResponse {
  error: 0;
  data: PreclinicalLiteratureSearchData;
  query: NormalizedPreclinicalLiteratureSearchQuery;
  message: string;
  [key: string]: unknown;
}

export function searchPreclinicalLiterature(
  params: PreclinicalLiteratureSearchParams,
  options: OpenApiRequestOptions = {},
): Promise<PreclinicalLiteratureSearchResponse> {
  return requestOpenApi<PreclinicalLiteratureSearchResponse>("/api/preclinical-literature/search", {
    ...options,
    method: "POST",
    body: params,
  });
}
