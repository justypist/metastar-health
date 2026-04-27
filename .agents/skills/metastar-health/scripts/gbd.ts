import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";

export type GbdSexName = "Male" | "Female" | "Both";

export interface GbdSearchParams {
  causeName?: string;
  measureName?: string;
  locationName?: string;
  sexName?: GbdSexName;
  metricName?: string;
  year?: number;
  startYear?: number;
  endYear?: number;
  limit?: number;
}

export interface GbdRow {
  causeId: number;
  causeName: string;
  measureId: number;
  measureName: string;
  locationId: number;
  locationName: string;
  sexId: number;
  sexName: GbdSexName | string;
  ageId: number;
  ageName: string;
  metricId: number;
  metricName: string;
  year: number;
  value: number | null;
  upper: number | null;
  lower: number | null;
  populationGroupName: string;
  [key: string]: unknown;
}

export interface GbdSearchData {
  rows: GbdRow[];
  total: number;
  limit: number;
}

export interface GbdSearchResponse {
  error: 0;
  data: GbdSearchData;
  query: GbdSearchParams;
  message: string;
  [key: string]: unknown;
}

export function searchGbdData(params: GbdSearchParams, options: OpenApiRequestOptions = {}): Promise<GbdSearchResponse> {
  return requestOpenApi<GbdSearchResponse>("/api/gbd/search", {
    ...options,
    method: "POST",
    body: params,
  });
}
