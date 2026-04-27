import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getTargetQuickAssessmentResult,
  pollTargetQuickAssessmentResult,
  submitTargetQuickAssessmentTask,
} from "./target-quick-assessment.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function successPayload(data: unknown): Response {
  return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
}

test("target quick assessment APIs post submissions, encode result paths, and poll results", async () => {
  const calls: FetchCall[] = [];
  const params = { targetNames: ["BRCA1", "EGFR"] };
  const completed = {
    taskId: "task id/1",
    status: "completed",
    progress: 100,
    completedCount: 2,
    totalCount: 2,
    targets: [],
  };
  const polled = { ...completed, taskId: "task id/2" };
  const responses = [successPayload({ taskId: "submit-1" }), successPayload(completed), successPayload(polled)];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    const response = responses.shift();
    assert.ok(response);
    return response;
  };
  const options = { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl };

  assert.deepEqual(await submitTargetQuickAssessmentTask(params, options), { taskId: "submit-1" });
  assert.deepEqual(await getTargetQuickAssessmentResult("task id/1", options), completed);
  assert.deepEqual(await pollTargetQuickAssessmentResult("task id/2", { ...options, intervalMs: 1, timeoutMs: 10 }), polled);

  assert.equal(String(calls[0]?.input), "https://api.example.test/api/target-quick-assessment/submit");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
  assert.equal(String(calls[1]?.input), "https://api.example.test/api/target-quick-assessment/result/task%20id%2F1");
  assert.equal(String(calls[2]?.input), "https://api.example.test/api/target-quick-assessment/result/task%20id%2F2");
});
