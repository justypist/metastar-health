import assert from "node:assert/strict";
import { test } from "node:test";

import {
  analyzeTargetCompetition,
  executeTool,
  getToolTaskResult,
  pollToolTaskResult,
  searchClinicalTrialRegistrations,
  searchConferencePresentations,
  searchDrugDeals,
  searchPatents,
  searchPreclinicalFromPatent,
  searchPubMed,
  searchWeb,
  submitToolTask,
} from "./tools.ts";
import { OpenApiRequestError } from "./types.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { headers: { "content-type": "application/json" } });
}

function createOptions(fetchImpl: OpenApiFetch) {
  return {
    appKey: "key",
    appSecret: "secret",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
  };
}

test("executeTool posts to generic tool execute endpoint", async () => {
  const calls: FetchCall[] = [];
  const params = { query: "EGFR lung cancer resistance", maxArticles: 5 };
  const response = {
    data: {
      toolName: "search_pubmed",
      status: "ok",
      data: { articles: [{ PMID: "1" }] },
      total: 1,
    },
    error: 0,
  };
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse(response);
  };

  assert.deepEqual(await executeTool("search_pubmed", params, createOptions(fetchImpl)), response);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/v1/tools/search_pubmed/execute");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, JSON.stringify(params));
});

test("submitToolTask, getToolTaskResult, and pollToolTaskResult use task endpoint", async () => {
  const calls: FetchCall[] = [];
  const submission = { data: { taskId: "task 1/2", status: "pending" }, error: 0 };
  const task = {
    data: {
      taskId: "task 1/2",
      toolName: "search_engine",
      status: "completed",
      progress: 100,
      result: {
        toolName: "search_engine",
        status: "ok",
        data: { query: "EGFR", results: [] },
      },
    },
    error: 0,
  };
  const responses = [jsonResponse(submission), jsonResponse(task), jsonResponse(task)];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    const response = responses.shift();
    assert.ok(response);
    return response;
  };
  const options = createOptions(fetchImpl);

  assert.deepEqual(await submitToolTask("search_engine", { query: "EGFR" }, options), submission.data);
  assert.deepEqual(await getToolTaskResult("task 1/2", options), task.data);
  assert.deepEqual(await pollToolTaskResult("task 1/2", { ...options, intervalMs: 1, timeoutMs: 10 }), task.data);
  assert.equal(String(calls[0]?.input), "https://api.example.test/api/v1/tools/search_engine/submit");
  assert.equal(String(calls[1]?.input), "https://api.example.test/api/v1/tools/tasks/task%201%2F2");
  assert.equal(String(calls[2]?.input), "https://api.example.test/api/v1/tools/tasks/task%201%2F2");
});

test("pollToolTaskResult formats object errors from failed tasks", async () => {
  const failedTask = {
    data: {
      taskId: "task-1",
      toolName: "search_pubmed",
      status: "failed",
      error: { code: "tool_execution_failed", message: "Upstream timeout" },
    },
    error: 0,
  };
  const fetchImpl: OpenApiFetch = async () => jsonResponse(failedTask);

  await assert.rejects(
    pollToolTaskResult("task-1", { ...createOptions(fetchImpl), intervalMs: 1, timeoutMs: 10 }),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.code, "TASK_FAILED");
      assert.equal(error.message, "Upstream timeout");
      return true;
    },
  );
});

test("typed tool wrappers map to documented tool names", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ data: { toolName: "tool", status: "ok", data: {}, total: 0 }, error: 0 });
  };
  const options = createOptions(fetchImpl);

  await searchPreclinicalFromPatent({ patentNumbers: ["WO2024000001"], limit: 1 }, options);
  await searchClinicalTrialRegistrations({ keyword: "Osimertinib", searchType: "drug", limit: 5 }, options);
  await searchDrugDeals({ keyword: "EGFR", searchType: "target" }, options);
  await analyzeTargetCompetition({ keyword: ["EGFR"], targetAliases: [["ERBB1"]] }, options);
  await searchPubMed({ query: "EGFR", maxArticles: 5 }, options);
  await searchPatents({ targets: [{ name: "EGFR" }], limit: 10 }, options);
  await searchWeb({ query: "EGFR latest", engines: ["google"], maxResults: 3 }, options);
  await searchConferencePresentations({ companies: [{ name: "AstraZeneca" }], limit: 2 }, options);

  assert.deepEqual(
    calls.map((call) => String(call.input)),
    [
      "https://api.example.test/api/v1/tools/preclinical_from_patent/execute",
      "https://api.example.test/api/v1/tools/zhy_api_synapse_clinical_trial_search/execute",
      "https://api.example.test/api/v1/tools/zhy_api_synapse_drug_deal_search/execute",
      "https://api.example.test/api/v1/tools/zhy_api_synapse_target_analysis/execute",
      "https://api.example.test/api/v1/tools/search_pubmed/execute",
      "https://api.example.test/api/v1/tools/search_patent/execute",
      "https://api.example.test/api/v1/tools/search_engine/execute",
      "https://api.example.test/api/v1/tools/search_conference_presentations/execute",
    ],
  );
});
