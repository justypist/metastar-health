import {
  autocompleteEntities,
  getHpaProfile,
  getPapersHealth,
  searchDrugs,
  searchGbdData,
  searchPapers,
} from "../api/index.ts";
import { handleExampleError, logExampleResult, readExampleContext, toOpenApiClientOptions } from "./context.ts";
import type { ExampleScenario } from "./scenarios.ts";

export async function exampleAutocompleteEntities(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await autocompleteEntities(
      {
        query: "EGFR",
        size: 5,
        type: "target",
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("autocompleteEntities", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSearchPapers(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchPapers(
      {
        disease: "lung cancer",
        target: "EGFR",
        limit: 5,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchPapers", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetPapersHealth(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await getPapersHealth(toOpenApiClientOptions(context));

    logExampleResult("getPapersHealth", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSearchDrugs(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchDrugs(
      {
        targets: [{ name: "EGFR", aliases: ["ERBB1"] }],
        diseases: [{ name: "non-small cell lung cancer" }],
        limit: 5,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchDrugs", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSearchGbdData(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchGbdData(
      {
        causeName: "Lung cancer",
        measureName: "Incidence",
        locationName: "Global",
        sexName: "Both",
        metricName: "Number",
        year: 2021,
        limit: 5,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchGbdData", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetHpaProfile(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await getHpaProfile(
      {
        target: "EGFR",
        aliases: ["ERBB1"],
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("getHpaProfile", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export const syncApiScenarios: readonly ExampleScenario[] = [
  {
    name: "autocomplete-entities",
    description: "Autocomplete target entities for an EGFR query.",
    run: exampleAutocompleteEntities,
  },
  {
    name: "search-papers",
    description: "Search papers by disease and target.",
    run: exampleSearchPapers,
  },
  {
    name: "get-papers-health",
    description: "Check the papers service health endpoint.",
    run: exampleGetPapersHealth,
  },
  {
    name: "search-drugs",
    description: "Search drug pipeline data by target and disease.",
    run: exampleSearchDrugs,
  },
  {
    name: "search-gbd-data",
    description: "Search GBD incidence data with real query parameters.",
    run: exampleSearchGbdData,
  },
  {
    name: "get-hpa-profile",
    description: "Fetch an HPA profile for EGFR.",
    run: exampleGetHpaProfile,
  },
];
