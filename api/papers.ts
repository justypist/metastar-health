import { requestOpenApiData } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";

export interface PaperSearchParams {
  disease?: string;
  drug?: string;
  target?: string;
  company?: string;
  limit?: number;
}

export interface PaperRecord {
  referenceId: string;
  referenceTitle: string;
  referenceTypes: string;
  pmid: number;
  pmc: string;
  pubdate: number;
  article_types: string;
  journal_name: string;
  journal_abbreviation: string;
  issn: string;
  doi: string;
  if_oid: number;
  abstract: string;
  keywords: string;
  "Drug Names": string;
  "Target Names": string;
  "Company Names": string;
  "Disease Names": string;
  url: string;
  source: string;
  [key: string]: unknown;
}

export interface PaperSearchResult {
  data: PaperRecord[];
  total: number;
  limit: number;
  query: Partial<Pick<PaperSearchParams, "disease" | "drug" | "target" | "company">>;
  error: number;
  [key: string]: unknown;
}

export interface PapersHealthResult {
  status: string;
  timestamp: string;
  service: string;
  elasticsearch: string;
  error: number;
  [key: string]: unknown;
}

export function searchPapers(params: PaperSearchParams, options: OpenApiRequestOptions = {}): Promise<PaperSearchResult> {
  return requestOpenApiData<PaperSearchResult>("/api/papers/search", {
    ...options,
    query: {
      disease: params.disease,
      drug: params.drug,
      target: params.target,
      company: params.company,
      limit: params.limit,
    },
  });
}

export function getPapersHealth(options: OpenApiRequestOptions = {}): Promise<PapersHealthResult> {
  return requestOpenApiData<PapersHealthResult>("/api/papers/health", options);
}
