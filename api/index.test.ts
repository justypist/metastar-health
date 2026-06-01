import assert from "node:assert/strict";
import { test } from "node:test";

import * as api from "./index.ts";
import type { AutocompleteEntitiesParams, FileInput, OpenApiClientOptions, TaskSubmission } from "./index.ts";

test("index exports public runtime API and no test-private helpers", () => {
  const expectedExports = [
    "DEFAULT_BASE_URL",
    "OpenApiRequestError",
    "analyzeTargetCompetition",
    "assertSuccessfulOpenApiResponse",
    "askTargetAssistantReport",
    "autocompleteEntities",
    "buildOpenApiUrl",
    "createUploadFormData",
    "executeTool",
    "getHpaProfile",
    "getLiteratureProcessResult",
    "getOcrResult",
    "getOpenApiFetch",
    "getPapersHealth",
    "getTargetAssistantResult",
    "getTargetQuickAssessmentResult",
    "getTextExtractionResult",
    "getToolTaskResult",
    "lookupLiteratureFulltext",
    "openApiToolNames",
    "parseOpenApiResponsePayload",
    "pollAsyncTask",
    "pollLiteratureProcessResult",
    "pollOcrResult",
    "pollTargetAssistantResult",
    "pollTargetQuickAssessmentResult",
    "pollTextExtractionResult",
    "pollToolTaskResult",
    "readOpenApiConfig",
    "requestOpenApi",
    "requestOpenApiData",
    "requestOpenApiUpload",
    "searchClinicalTrialRegistrations",
    "searchClinicalTrialResults",
    "searchClinicalTrials",
    "searchConferencePosters",
    "searchConferencePresentations",
    "searchDrugs",
    "searchDrugDeals",
    "searchGbdData",
    "searchMedwatch",
    "searchPapers",
    "searchPatents",
    "searchPatentCore",
    "searchPharmaNews",
    "searchPreclinicalFromPatent",
    "searchPreclinicalLiterature",
    "searchPubMed",
    "searchReviewLiterature",
    "searchTargetAssistantRag",
    "searchWeb",
    "submitLiteratureProcessTask",
    "submitOcrTask",
    "submitTargetAssistantTask",
    "submitTargetQuickAssessmentTask",
    "submitTextExtractionTask",
    "submitToolTask",
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
