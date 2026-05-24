import assert from "node:assert/strict";
import { test } from "node:test";

import { searchPreclinicalLiterature } from "./preclinical-literature.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("searchPreclinicalLiterature posts entity params and returns parsed response", async () => {
  const calls: FetchCall[] = [];
  const params = {
    targets: [{ name: "GLP1R", aliases: "GLP-1R;Glucagon-like peptide-1 receptor" }],
    diseases: [{ name: "Type 2 Diabetes", aliases: ["T2D"] }],
    companies: [{ name: "Novo Nordisk" }],
    limit: 20,
  };
  const response = {
    error: 0,
    data: {
      status: "completed",
      progress: 100,
      result: [{ ID: "preclinical_doc_001", PMID: "12345678", Target: "GLP1R" }],
      total: 1,
      limit: 20,
    },
    query: params,
    message: "ok",
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };

  const result = await searchPreclinicalLiterature(params, {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  });

  assert.deepEqual(result, response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/preclinical-literature/search");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});
