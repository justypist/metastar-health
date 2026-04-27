import { requestOpenApiData } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";
import type { AutocompleteEntity, EntityType } from "./types.ts";

export interface AutocompleteEntitiesParams {
  query: string;
  size?: number;
  type?: EntityType;
}

export interface AutocompleteEntitiesResult {
  suggestions: AutocompleteEntity[];
  total: number;
  query: string;
  [key: string]: unknown;
}

export function autocompleteEntities(
  params: AutocompleteEntitiesParams,
  options: OpenApiRequestOptions = {},
): Promise<AutocompleteEntitiesResult> {
  return requestOpenApiData<AutocompleteEntitiesResult>("/api/ai/autocomplete/entities", {
    ...options,
    query: {
      query: params.query,
      size: params.size,
      type: params.type,
    },
  });
}
