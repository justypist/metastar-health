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
    page: 2,
    pageSize: 50,
  };
  const response = {
    error: 0,
    data: {
      status: "completed",
      progress: 100,
      result: [
        {
          PMID: "12345678",
          title: "Preclinical evaluation of GLP1R agonism",
          Target: "GLP1R",
          Antibody_Name: "Semaglutide",
          Clinical_Phase: "Approved",
          source_type: "literature",
          pubdate: "2024-01-02",
          indication: "Type 2 Diabetes",
          model_info: [{ model_name: "db/db mouse" }],
        },
      ],
      count: 1,
      page: 2,
      pageSize: 50,
      hasMore: true,
      nextPage: 3,
    },
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
