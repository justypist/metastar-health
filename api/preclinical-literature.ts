import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { EntityInput } from "./types.ts";

export interface PreclinicalLiteratureSearchParams {
  targets?: EntityInput[];
  diseases?: EntityInput[];
  companies?: EntityInput[];
  page?: number;
  pageSize?: number;
}

export type PreclinicalLiteratureSourceType = "literature" | "poster" | "presentation" | (string & {});

export interface PreclinicalLiteratureRecord {
  PMID?: string;
  title?: string;
  Target?: string;
  Antibody_Name?: string;
  Clinical_Phase?: string;
  source_type?: PreclinicalLiteratureSourceType;
  pubdate?: string;
  indication?: string;
  model_info?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface PreclinicalLiteratureSearchData {
  status: "completed" | string;
  progress: number;
  result: PreclinicalLiteratureRecord[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage?: number;
}

export interface NormalizedPreclinicalLiteratureSearchQuery {
  targets: EntityInput[];
  diseases: EntityInput[];
  companies: EntityInput[];
  page: number;
  pageSize: number;
}

export interface PreclinicalLiteratureSearchResponse {
  error: 0;
  data: PreclinicalLiteratureSearchData;
  query?: NormalizedPreclinicalLiteratureSearchQuery;
  message?: string;
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
