export const DEFAULT_BASE_URL = "https://search-alpha.metastar-health.com/prod-api";

export interface OpenApiCredentials {
  appKey: string;
  appSecret: string;
}

export interface OpenApiConfig extends OpenApiCredentials {
  baseUrl: string;
}

export interface OpenApiConfigOverrides {
  appKey?: string;
  appSecret?: string;
  baseUrl?: string;
}

interface ProcessLike {
  env?: Record<string, string | undefined>;
}

function getProcessEnv(): Record<string, string | undefined> {
  const runtime = globalThis as typeof globalThis & { process?: ProcessLike };

  return runtime.process?.env ?? {};
}

export function readOpenApiConfig(overrides: OpenApiConfigOverrides = {}): OpenApiConfig {
  const env = getProcessEnv();
  const appKey = overrides.appKey ?? env.APP_KEY;
  const appSecret = overrides.appSecret ?? env.APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("Missing APP_KEY or APP_SECRET for open API requests.");
  }

  return {
    appKey,
    appSecret,
    baseUrl: overrides.baseUrl ?? env.OPEN_API_BASE_URL ?? DEFAULT_BASE_URL,
  };
}
