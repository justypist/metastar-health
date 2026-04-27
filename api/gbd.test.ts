import assert from "node:assert/strict";
import { test } from "node:test";

import { searchGbdData } from "./gbd.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("searchGbdData posts search params and returns the parsed response", async () => {
  const calls: FetchCall[] = [];
  const params = { causeName: "neoplasm", sexName: "Both" as const, startYear: 2020, endYear: 2021, limit: 3 };
  const response = {
    error: 0,
    data: { rows: [], total: 0, limit: 3 },
    query: params,
    message: "ok",
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };

  const result = await searchGbdData(params, {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  });

  assert.deepEqual(result, response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/gbd/search");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});
