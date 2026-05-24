import assert from "node:assert/strict";
import { test } from "node:test";

import {
  askTargetAssistantReport,
  getTargetAssistantResult,
  pollTargetAssistantResult,
  searchTargetAssistantRag,
  submitTargetAssistantTask,
} from "./target-assistant.ts";
import { OpenApiRequestError } from "./types.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function successPayload(data: unknown): Response {
  return new Response(JSON.stringify({ data, error: 0 }), { headers: { "content-type": "application/json" } });
}

test("submitTargetAssistantTask posts params and returns successful submission", async () => {
  const calls: FetchCall[] = [];
  const params = { target: "BRCA1", language: "en-US" as const };
  const data = { success: true, taskId: "task-1", message: "submitted", validatedTarget: { name: "BRCA1" } };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return successPayload(data);
  };

  assert.deepEqual(
    await submitTargetAssistantTask(params, {
      appKey: "key",
      appSecret: "secret",
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    }),
    data,
  );
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/target-assistant/submit");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});

test("submitTargetAssistantTask throws when validation fails", async () => {
  const fetchImpl: OpenApiFetch = async () => successPayload({ success: false, message: "Unknown target" });

  await assert.rejects(
    submitTargetAssistantTask(
      { target: "missing" },
      { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl },
    ),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.code, "TARGET_VALIDATION_FAILED");
      assert.equal(error.message, "Unknown target");
      return true;
    },
  );
});

test("target assistant result APIs encode paths and poll results", async () => {
  const calls: FetchCall[] = [];
  const completed = { taskId: "task id/1", status: "completed", progress: 100, target: "BRCA1" };
  const polled = { taskId: "task id/2", status: "completed", progress: 100, target: "EGFR" };
  const responses = [successPayload(completed), successPayload(polled)];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    const response = responses.shift();
    assert.ok(response);
    return response;
  };
  const options = { appKey: "key", appSecret: "secret", baseUrl: "https://api.example.test", fetch: fetchImpl };

  assert.deepEqual(await getTargetAssistantResult("task id/1", options), completed);
  assert.deepEqual(await pollTargetAssistantResult("task id/2", { ...options, intervalMs: 1, timeoutMs: 10 }), polled);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/target-assistant/result/task%20id%2F1");
  assert.equal(String(calls[1]?.input), "https://api.example.test/api/target-assistant/result/task%20id%2F2");
});

test("askTargetAssistantReport posts QA params and returns data", async () => {
  const calls: FetchCall[] = [];
  const params = { taskId: "task-1", question: "EGFR 的临床证据是什么？", language: "zh-CN" as const };
  const data = {
    success: true,
    taskId: "task-1",
    target: "EGFR",
    scope: "full_task",
    sessionId: "session-1",
    answer: "answer",
    citations: [{ id: "1", sourceLabel: "PMID:1" }],
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return successPayload(data);
  };

  assert.deepEqual(
    await askTargetAssistantReport(params, {
      appKey: "key",
      appSecret: "secret",
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    }),
    data,
  );
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/target-assistant/report/qa");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});

test("searchTargetAssistantRag posts retrieval params and returns data", async () => {
  const calls: FetchCall[] = [];
  const params = { taskId: "task-1", question: "耐药风险", dataLimit: 8, reportLimit: 6 };
  const data = {
    success: true,
    taskId: "task-1",
    target: "EGFR",
    question: "耐药风险",
    relatedData: [{ id: "clinical:1", type: "data", moduleId: "clinical" }],
    reportChunks: [{ id: "report:1", type: "report_chunk", moduleId: "report" }],
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return successPayload(data);
  };

  assert.deepEqual(
    await searchTargetAssistantRag(params, {
      appKey: "key",
      appSecret: "secret",
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    }),
    data,
  );
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/target-assistant/rag/search");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});
