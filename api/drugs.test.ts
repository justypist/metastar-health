import assert from "node:assert/strict";
import { test } from "node:test";

import { searchDrugs } from "./drugs.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("searchDrugs posts search params and returns the parsed response", async () => {
  const calls: FetchCall[] = [];
  const params = {
    diseases: [{ name: "cancer" }],
    targets: [{ name: "EGFR", aliases: ["ERBB1"] }],
    statuses: ["approved"],
    limit: 5,
  };
  const response = {
    error: 0,
    data: { columns: [], rows: [], total: 0, limit: 5 },
    query: { diseases: params.diseases, drugs: [], targets: params.targets, companies: [], statuses: params.statuses, modalities: [], limit: 5 },
    message: "ok",
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };

  const result = await searchDrugs(params, {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  });

  assert.deepEqual(result, response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/drugs/search");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});
