import { requestOpenApi } from "./client.ts";
import type { OpenApiRequestOptions } from "./client.ts";

export interface HpaProfileParams {
  target: string;
  aliases?: string | string[];
}

export interface HpaRecommendedDiseasePanel {
  oncologyRelated: boolean;
  panelType: "cancer" | "blood" | string;
  url: string;
  [key: string]: unknown;
}

export interface HpaProfile {
  target: string;
  subcellularHumanCellLines: string;
  rnaProteinExpressionSummary: string;
  tissueProteinExpressionOverview: string;
  tissueRnaExpressionOverview: string;
  tissueExpressionCluster: string;
  cancerProteinExpressionPanel: string;
  bloodPanDiseaseSomascan: string;
  proteinFunction: string;
  proteinExpressionAndLocalization: string;
  cellTypeRnaExpression: string;
  msId: string;
  msName: string;
  targetNames: string[];
  recommendedDiseasePanel: HpaRecommendedDiseasePanel;
  [key: string]: unknown;
}

export interface HpaProfileQuery {
  target: string;
  aliases: string[];
}

export interface HpaProfileResponse {
  error: 0;
  data: HpaProfile | null;
  query: HpaProfileQuery;
  message: string;
  [key: string]: unknown;
}

function normalizeAliases(aliases: HpaProfileParams["aliases"]): string | undefined {
  return Array.isArray(aliases) ? aliases.join(";") : aliases;
}

export function getHpaProfile(params: HpaProfileParams, options: OpenApiRequestOptions = {}): Promise<HpaProfileResponse> {
  return requestOpenApi<HpaProfileResponse>("/api/hpa/profile", {
    ...options,
    query: {
      target: params.target,
      aliases: normalizeAliases(params.aliases),
    },
  });
}
