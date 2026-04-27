import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { EntityInput } from "./types.ts";

export interface DrugSearchParams {
  diseases?: EntityInput[];
  drugs?: EntityInput[];
  targets?: EntityInput[];
  companies?: EntityInput[];
  statuses?: string[];
  modalities?: string[];
  limit?: number;
}

export interface DrugTableColumn {
  key: string;
  title: string;
}

export type DrugTableCell = string | string[] | null;

export interface DrugTableRow {
  genericDrugName: DrugTableCell;
  chemicalStructure: DrugTableCell;
  mechanismOfAction: DrugTableCell;
  company: DrugTableCell;
  disease: DrugTableCell;
  highestIndicationStage: DrugTableCell;
  highestPipelineStage: DrugTableCell;
  drugCountry: DrugTableCell;
  modality: DrugTableCell;
  deliveryRoute: DrugTableCell;
  target: DrugTableCell;
  [key: string]: unknown;
}

export interface DrugSearchData {
  columns: DrugTableColumn[];
  rows: DrugTableRow[];
  total: number;
  limit: number;
}

export interface NormalizedDrugSearchQuery {
  diseases: EntityInput[];
  drugs: EntityInput[];
  targets: EntityInput[];
  companies: EntityInput[];
  statuses: string[];
  modalities: string[];
  limit: number;
}

export interface DrugSearchResponse {
  error: 0;
  data: DrugSearchData;
  query: NormalizedDrugSearchQuery;
  message: string;
  [key: string]: unknown;
}

export function searchDrugs(params: DrugSearchParams, options: OpenApiRequestOptions = {}): Promise<DrugSearchResponse> {
  return requestOpenApi<DrugSearchResponse>("/api/drugs/search", {
    ...options,
    method: "POST",
    body: params,
  });
}
