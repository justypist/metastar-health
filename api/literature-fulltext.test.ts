import assert from "node:assert/strict";
import { test } from "node:test";

import { lookupLiteratureFulltext } from "./literature-fulltext.ts";
import type { LiteratureFulltextLookupResponse, OpenApiFetch } from "./index.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("lookupLiteratureFulltext posts pmid or doi params and returns parsed response", async () => {
  const calls: FetchCall[] = [];
  const params = { pmid: "29021135", limit: 100 };
  const response: LiteratureFulltextLookupResponse = {
    error: 0,
    data: {
      fulltextExists: true,
      article: {
        pmid: "29021135",
        doi: "10.1038/nature12373",
        title: "Example article title",
        journalName: "Nature",
        pubdate: "2017",
      },
      chunks: [
        {
          chunkId: "fulltext_chunk_001",
          parentPmid: "29021135",
          chunkType: "text",
          sectionKey: "RESULTS",
          order: 1,
          content: "Full-text paragraph...",
        },
      ],
      total: 1,
      limit: 100,
    },
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };

  const result = await lookupLiteratureFulltext(params, {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  });

  assert.deepEqual(result, response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/literature-fulltext/lookup");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});
