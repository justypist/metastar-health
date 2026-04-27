import assert from "node:assert/strict";
import { test } from "node:test";

import { getOcrResult, pollOcrResult, submitOcrTask } from "./ocr.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonPayload(data: unknown): Response {
  return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
}

test("OCR APIs submit uploads, encode result paths, and poll results", async () => {
  const calls: FetchCall[] = [];
  const responses = [
    jsonPayload({ taskId: "submit-1" }),
    jsonPayload({ taskId: "task id/1", status: "completed", progress: 100 }),
    jsonPayload({ taskId: "task id/2", status: "completed", progress: 100 }),
  ];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    const response = responses.shift();
    assert.ok(response);
    return response;
  };
  const options = { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl };

  assert.deepEqual(await submitOcrTask(new Blob(["fake"]), options), { taskId: "submit-1" });
  assert.deepEqual(await getOcrResult("task id/1", options), { taskId: "task id/1", status: "completed", progress: 100 });
  assert.deepEqual(await pollOcrResult("task id/2", { ...options, intervalMs: 1, timeoutMs: 10 }), {
    taskId: "task id/2",
    status: "completed",
    progress: 100,
  });

  assert.equal(String(calls[0]?.input), "https://api.example.test/api/ocr/submit");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.ok(calls[0]?.init?.body instanceof FormData);
  assert.equal(String(calls[1]?.input), "https://api.example.test/api/ocr/result/task%20id%2F1");
  assert.equal(String(calls[2]?.input), "https://api.example.test/api/ocr/result/task%20id%2F2");
});
