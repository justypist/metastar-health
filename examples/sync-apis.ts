import {
  autocompleteEntities,
  getHpaProfile,
  getPapersHealth,
  lookupLiteratureFulltext,
  searchDrugs,
  searchGbdData,
  searchPapers,
  searchWeb,
  searchPatents,
  searchPreclinicalLiterature,
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

export async function exampleSearchPreclinicalLiterature(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchPreclinicalLiterature(
      {
        targets: [{ name: "EGFR", aliases: ["ERBB1"] }],
        diseases: [{ name: "non-small cell lung cancer" }],
        page: 1,
        pageSize: 10,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchPreclinicalLiterature", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleLookupLiteratureFulltext(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await lookupLiteratureFulltext(
      {
        pmid: "29021135",
        limit: 100,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("lookupLiteratureFulltext", result);
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

export async function exampleSearchPatents(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchPatents(
      {
        targets: [{ name: "EGFR" }],
        limit: 5,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchPatents", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSearchWeb(): Promise<void> {
  try {
    const context = readExampleContext();
    const result = await searchWeb(
      {
        query: "EGFR latest",
        engines: ["google"],
        maxResults: 10,
      },
      toOpenApiClientOptions(context),
    );

    logExampleResult("searchWeb", result);
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
    name: "search-preclinical-literature",
    description: "Search paginated literature-derived preclinical documents.",
    run: exampleSearchPreclinicalLiterature,
  },
  {
    name: "lookup-literature-fulltext",
    description: "Check whether a PubMed article has local full-text chunks.",
    run: exampleLookupLiteratureFulltext,
  },
  {
    name: "get-hpa-profile",
    description: "Fetch an HPA profile for EGFR.",
    run: exampleGetHpaProfile,
  },
  {
    name: "search-patents",
    description: "Search patents by target entity.",
    run: exampleSearchPatents,
  },
  {
    name: "search-web",
    description: "Search the web using the search engine tool.",
    run: exampleSearchWeb,
  },
];
