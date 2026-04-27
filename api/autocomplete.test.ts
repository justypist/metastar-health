import assert from "node:assert/strict";
import { test } from "node:test";

import { autocompleteEntities } from "./autocomplete.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("autocompleteEntities requests entity suggestions with query parameters", async () => {
  const calls: FetchCall[] = [];
  const data = {
    suggestions: [
      {
        name: "BRCA1",
        type: "target",
        aliases: "RNF53",
        _score: 1,
        highest_status: null,
        highest_status_sort: null,
      },
    ],
    total: 1,
    query: "brca",
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
  };

  const result = await autocompleteEntities(
    { query: "brca", size: 5, type: "target" },
    { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl },
  );

  assert.equal(result, data);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/ai/autocomplete/entities?query=brca&size=5&type=target");
  assert.equal(calls[0]?.init?.method, "GET");
});
