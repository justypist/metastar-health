import assert from "node:assert/strict";
import { test } from "node:test";

import * as api from "./index.ts";
import type { AutocompleteEntitiesParams, FileInput, OpenApiClientOptions, TaskSubmission } from "./index.ts";

test("index exports public runtime API and no test-private helpers", () => {
  const expectedExports = [
    "DEFAULT_BASE_URL",
    "OpenApiRequestError",
    "assertSuccessfulOpenApiResponse",
    "autocompleteEntities",
    "buildOpenApiUrl",
    "createUploadFormData",
    "getHpaProfile",
    "getLiteratureProcessResult",
    "getOcrResult",
    "getOpenApiFetch",
    "getPapersHealth",
    "getTargetAssistantResult",
    "getTargetQuickAssessmentResult",
    "getTextExtractionResult",
    "parseOpenApiResponsePayload",
    "pollAsyncTask",
    "pollLiteratureProcessResult",
    "pollOcrResult",
    "pollTargetAssistantResult",
    "pollTargetQuickAssessmentResult",
    "pollTextExtractionResult",
    "readOpenApiConfig",
    "requestOpenApi",
    "requestOpenApiData",
    "requestOpenApiUpload",
    "searchDrugs",
    "searchGbdData",
    "searchPapers",
    "submitLiteratureProcessTask",
    "submitOcrTask",
    "submitTargetAssistantTask",
    "submitTargetQuickAssessmentTask",
    "submitTextExtractionTask",
  ];
  const exported = Object.keys(api).sort();

  assert.deepEqual(exported, expectedExports.sort());
  assert.equal(exported.some((name) => name.includes("test") || name.includes("Test")), false);
  assert.equal(exported.includes("createJsonResponse"), false);
});

test("index exposes public type entries for compilation", () => {
  const params: AutocompleteEntitiesParams = { query: "brca", type: "target" };
  const file: FileInput = { data: new Uint8Array([1]), filename: "sample.bin" };
  const options: OpenApiClientOptions = { appKey: "key", appSecret: "secret" };
  const submission: TaskSubmission = { taskId: "task-1" };

  assert.equal(params.query, "brca");
  assert.equal(typeof file, "object");
  assert.equal(options.appKey, "key");
  assert.equal(submission.taskId, "task-1");
});
