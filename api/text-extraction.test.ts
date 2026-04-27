import assert from "node:assert/strict";
import { test } from "node:test";

import { getTextExtractionResult, pollTextExtractionResult, submitTextExtractionTask } from "./text-extraction.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonPayload(data: unknown): Response {
  return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
}

test("text extraction APIs submit uploads, encode result paths, and poll results", async () => {
  const calls: FetchCall[] = [];
  const responses = [
    jsonPayload({ taskId: "submit-1" }),
    jsonPayload({ taskId: "task id/1", status: "completed", progress: 100, result: [] }),
    jsonPayload({ taskId: "task id/2", status: "completed", progress: 100, result: [] }),
  ];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    const response = responses.shift();
    assert.ok(response);
    return response;
  };
  const options = { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl };

  assert.deepEqual(await submitTextExtractionTask(new Blob(["fake"]), options), { taskId: "submit-1" });
  assert.deepEqual(await getTextExtractionResult("task id/1", options), {
    taskId: "task id/1",
    status: "completed",
    progress: 100,
    result: [],
  });
  assert.deepEqual(await pollTextExtractionResult("task id/2", { ...options, intervalMs: 1, timeoutMs: 10 }), {
    taskId: "task id/2",
    status: "completed",
    progress: 100,
    result: [],
  });

  assert.equal(String(calls[0]?.input), "https://api.example.test/api/text-extraction/submit");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.ok(calls[0]?.init?.body instanceof FormData);
  assert.equal(String(calls[1]?.input), "https://api.example.test/api/text-extraction/result/task%20id%2F1");
  assert.equal(String(calls[2]?.input), "https://api.example.test/api/text-extraction/result/task%20id%2F2");
});
