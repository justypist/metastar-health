import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { DEFAULT_BASE_URL, readOpenApiConfig } from "./config.ts";

const originalEnv = {
  APP_KEY: process.env.APP_KEY,
  APP_SECRET: process.env.APP_SECRET,
  OPEN_API_BASE_URL: process.env.OPEN_API_BASE_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test("readOpenApiConfig reads credentials and base URL from environment", () => {
  process.env.APP_KEY = "env-key";
  process.env.APP_SECRET = "env-secret";
  process.env.OPEN_API_BASE_URL = "https://api.example.test";

  assert.deepEqual(readOpenApiConfig(), {
    appKey: "env-key",
    appSecret: "env-secret",
    baseUrl: "https://api.example.test",
  });
});

test("readOpenApiConfig lets overrides win over environment", () => {
  process.env.APP_KEY = "env-key";
  process.env.APP_SECRET = "env-secret";
  process.env.OPEN_API_BASE_URL = "https://env.example.test";

  assert.deepEqual(
    readOpenApiConfig({
      appKey: "override-key",
      appSecret: "override-secret",
      baseUrl: "https://override.example.test",
    }),
    {
      appKey: "override-key",
      appSecret: "override-secret",
      baseUrl: "https://override.example.test",
    },
  );
});

test("readOpenApiConfig throws when credentials are missing", () => {
  delete process.env.APP_KEY;
  delete process.env.APP_SECRET;
  delete process.env.OPEN_API_BASE_URL;

  assert.throws(() => readOpenApiConfig(), /Missing APP_KEY or APP_SECRET/);
  assert.equal(
    readOpenApiConfig({ appKey: "override-key", appSecret: "override-secret" }).baseUrl,
    DEFAULT_BASE_URL,
  );
});
