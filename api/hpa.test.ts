import assert from "node:assert/strict";
import { test } from "node:test";

import { getHpaProfile } from "./hpa.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("getHpaProfile requests profile path and normalizes aliases arrays", async () => {
  const calls: FetchCall[] = [];
  const response = {
    error: 0,
    data: null,
    query: { target: "BRCA1", aliases: ["RNF53", "BRCC1"] },
    message: "ok",
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };

  const result = await getHpaProfile(
    { target: "BRCA1", aliases: ["RNF53", "BRCC1"] },
    { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl },
  );

  assert.equal(result, response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/hpa/profile?target=BRCA1&aliases=RNF53%3BBRCC1");
  assert.equal(calls[0]?.init?.method, "GET");
});
