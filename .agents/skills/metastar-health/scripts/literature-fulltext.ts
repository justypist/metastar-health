import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";

export interface LiteratureFulltextLookupParams {
  pmid?: string;
  doi?: string;
  limit?: number;
}

export interface LiteratureFulltextArticle {
  pmid: string;
  doi?: string;
  title?: string;
  journalName?: string;
  pubdate?: string;
  [key: string]: unknown;
}

export type LiteratureFulltextChunkType = "text" | "table" | "figure" | (string & {});

export interface LiteratureFulltextChunk {
  chunkId: string;
  parentPmid: string;
  chunkType: LiteratureFulltextChunkType;
  sectionKey?: string;
  order: number;
  content: string;
  [key: string]: unknown;
}

export interface LiteratureFulltextLookupData {
  fulltextExists: boolean;
  article?: LiteratureFulltextArticle;
  chunks: LiteratureFulltextChunk[];
  total: number;
  limit: number;
  [key: string]: unknown;
}

export interface LiteratureFulltextLookupResponse {
  error: 0;
  data: LiteratureFulltextLookupData;
  message?: string;
  [key: string]: unknown;
}

export function lookupLiteratureFulltext(
  params: LiteratureFulltextLookupParams,
  options: OpenApiRequestOptions = {},
): Promise<LiteratureFulltextLookupResponse> {
  return requestOpenApi<LiteratureFulltextLookupResponse>("/api/literature-fulltext/lookup", {
    ...options,
    method: "POST",
    body: params,
  });
}
