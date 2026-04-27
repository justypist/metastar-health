import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildOpenApiUrl,
  parseOpenApiResponsePayload,
  requestOpenApi,
  requestOpenApiData,
} from "./client.ts";
import { OpenApiRequestError } from "./types.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function createJsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

test("buildOpenApiUrl normalizes base, path, and query parameters", () => {
  const url = buildOpenApiUrl("https://api.example.test/base", "/v1/search", {
    q: "cancer",
    page: 2,
    exact: false,
    skip: undefined,
    empty: null,
    tags: ["drug", "target"],
  });

  assert.equal(url.toString(), "https://api.example.test/base/v1/search?q=cancer&page=2&exact=false&tags=drug&tags=target");
});

test("parseOpenApiResponsePayload parses JSON, text, and empty responses", async () => {
  assert.deepEqual(
    await parseOpenApiResponsePayload(createJsonResponse({ ok: true })),
    { ok: true },
  );
  assert.equal(await parseOpenApiResponsePayload(new Response("plain text")), "plain text");
  assert.equal(await parseOpenApiResponsePayload(new Response("")), undefined);
});

test("requestOpenApi sends JSON body, auth headers, and returns parsed payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ data: { id: "result-1" }, error: 0 });
  };

  const result = await requestOpenApi<{ data: { id: string }; error: 0 }>("/items", {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
    query: { q: "BRCA1" },
    body: { limit: 5 },
    headers: { "x-request-id": "request-1" },
  });

  assert.deepEqual(result, { data: { id: "result-1" }, error: 0 });
  assert.equal(calls.length, 1);

  const [call] = calls;
  assert.equal(String(call.input), "https://api.example.test/items?q=BRCA1");
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.body, JSON.stringify({ limit: 5 }));

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("x-app-key"), "key");
  assert.equal(headers.get("x-app-secret"), "secret");
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("x-request-id"), "request-1");
});

test("requestOpenApiData unwraps the data field", async () => {
  const fetchImpl: OpenApiFetch = async () => createJsonResponse({ data: { id: "data-1" }, error: 0 });

  const data = await requestOpenApiData<{ id: string }>("/items/data", {
    appKey: "key",
    appSecret: "secret",
    fetch: fetchImpl,
  });

  assert.deepEqual(data, { id: "data-1" });
});

test("requestOpenApi throws OpenApiRequestError for API errors", async () => {
  const fetchImpl: OpenApiFetch = async () => createJsonResponse(
    { data: { reason: "invalid" }, error: "INVALID", message: "Invalid request" },
    { status: 400, statusText: "Bad Request" },
  );

  await assert.rejects(
    requestOpenApi("/items/error", {
      appKey: "key",
      appSecret: "secret",
      fetch: fetchImpl,
    }),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.status, 400);
      assert.equal(error.statusText, "Bad Request");
      assert.equal(error.code, "INVALID");
      assert.deepEqual(error.data, { reason: "invalid" });
      return true;
    },
  );
});
