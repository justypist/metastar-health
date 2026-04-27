import {
  assertSuccessfulOpenApiResponse,
  buildOpenApiUrl,
  getOpenApiFetch,
  parseOpenApiResponsePayload,
  readOpenApiConfig,
  requestOpenApi,
  requestOpenApiData,
} from "../api/index.ts";
import {
  exampleAuthHeaders,
  exampleClientOptions,
  handleExampleError,
  logExampleResult,
  readExampleContext,
} from "./context.ts";
import type { ExampleScenario } from "./scenarios.ts";
import type { ApiSuccessResponse, PapersHealthResult } from "../api/index.ts";

export function exampleReadOpenApiConfig(): void {
  try {
    const config = readOpenApiConfig();

    logExampleResult("readOpenApiConfig", {
      baseUrl: config.baseUrl,
      appKeyConfigured: config.appKey.length > 0,
      appSecretConfigured: config.appSecret.length > 0,
    });
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetOpenApiFetch(): Promise<void> {
  try {
    const context = readExampleContext();
    const config = readOpenApiConfig(exampleClientOptions(context));
    const fetchImpl = getOpenApiFetch();
    const response = await fetchImpl(buildOpenApiUrl(config.baseUrl, "/api/papers/health"), {
      headers: exampleAuthHeaders(context),
    });

    logExampleResult("getOpenApiFetch", { ok: response.ok, status: response.status });
  } catch (error) {
    handleExampleError(error);
  }
}

export function exampleBuildOpenApiUrl(): void {
  try {
    const context = readExampleContext();
    const config = readOpenApiConfig(exampleClientOptions(context));
    const url = buildOpenApiUrl(config.baseUrl, "/api/papers/search", {
      disease: "lung cancer",
      limit: 5,
    });

    logExampleResult("buildOpenApiUrl", url.toString());
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleParseOpenApiResponsePayload(): Promise<void> {
  try {
    const context = readExampleContext();
    const config = readOpenApiConfig(exampleClientOptions(context));
    const response = await getOpenApiFetch()(buildOpenApiUrl(config.baseUrl, "/api/papers/health"), {
      headers: exampleAuthHeaders(context),
    });
    const payload = await parseOpenApiResponsePayload(response);

    logExampleResult("parseOpenApiResponsePayload", payload);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleAssertSuccessfulOpenApiResponse(): Promise<void> {
  try {
    const context = readExampleContext();
    const config = readOpenApiConfig(exampleClientOptions(context));
    const response = await getOpenApiFetch()(buildOpenApiUrl(config.baseUrl, "/api/papers/health"), {
      headers: exampleAuthHeaders(context),
    });
    const payload = await parseOpenApiResponsePayload(response);

    assertSuccessfulOpenApiResponse(response, payload);
    logExampleResult("assertSuccessfulOpenApiResponse", payload);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleRequestOpenApi(): Promise<void> {
  try {
    const context = readExampleContext();
    const response = await requestOpenApi<ApiSuccessResponse<PapersHealthResult>>("/api/papers/health", exampleClientOptions(context));

    logExampleResult("requestOpenApi", response);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleRequestOpenApiData(): Promise<void> {
  try {
    const context = readExampleContext();
    const data = await requestOpenApiData<PapersHealthResult>("/api/papers/health", exampleClientOptions(context));

    logExampleResult("requestOpenApiData", data);
  } catch (error) {
    handleExampleError(error);
  }
}

export const basicScenarios: readonly ExampleScenario[] = [
  {
    name: "read-open-api-config",
    description: "Read APP_KEY, APP_SECRET, and OPEN_API_BASE_URL for open API requests.",
    run: async () => exampleReadOpenApiConfig(),
  },
  {
    name: "get-open-api-fetch",
    description: "Resolve the fetch implementation and call the papers health endpoint.",
    run: exampleGetOpenApiFetch,
  },
  {
    name: "build-open-api-url",
    description: "Build a real papers search URL with query parameters.",
    run: async () => exampleBuildOpenApiUrl(),
  },
  {
    name: "parse-open-api-response-payload",
    description: "Fetch and parse a real open API JSON response payload.",
    run: exampleParseOpenApiResponsePayload,
  },
  {
    name: "assert-successful-open-api-response",
    description: "Fetch, parse, and assert a successful open API response.",
    run: exampleAssertSuccessfulOpenApiResponse,
  },
  {
    name: "request-open-api",
    description: "Call the papers health endpoint with the low-level response helper.",
    run: exampleRequestOpenApi,
  },
  {
    name: "request-open-api-data",
    description: "Call the papers health endpoint and unwrap the data payload.",
    run: exampleRequestOpenApiData,
  },
];
