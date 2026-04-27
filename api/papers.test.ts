import assert from "node:assert/strict";
import { test } from "node:test";

import { getPapersHealth, searchPapers } from "./papers.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonPayload(data: unknown): Response {
  return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
}

test("searchPapers requests papers search path with query parameters", async () => {
  const calls: FetchCall[] = [];
  const data = { data: [], total: 0, limit: 10, query: { disease: "cancer", target: "EGFR" }, error: 0 };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return jsonPayload(data);
  };

  const result = await searchPapers(
    { disease: "cancer", target: "EGFR", limit: 10 },
    { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl },
  );

  assert.equal(result, data);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/papers/search?disease=cancer&target=EGFR&limit=10");
  assert.equal(calls[0]?.init?.method, "GET");
});

test("getPapersHealth requests health path and returns health data", async () => {
  const calls: FetchCall[] = [];
  const data = {
    status: "ok",
    timestamp: "2026-04-28T00:00:00.000Z",
    service: "papers",
    elasticsearch: "green",
    error: 0,
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return jsonPayload(data);
  };

  const result = await getPapersHealth({
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  });

  assert.equal(result, data);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/papers/health");
});
