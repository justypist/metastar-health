import assert from "node:assert/strict";
import { test } from "node:test";

import { OpenApiRequestError } from "./types.ts";
import type {
  ApiSuccessResponse,
  AsyncTaskBase,
  EntityInput,
  FileInput,
  OpenApiClientOptions,
  UploadFileOptions,
} from "./types.ts";

test("OpenApiRequestError preserves supplied details", () => {
  const response = { error: "BAD_REQUEST", data: { field: "name" } };
  const error = new OpenApiRequestError({
    status: 400,
    statusText: "Bad Request",
    code: "BAD_REQUEST",
    message: "Invalid request",
    response,
    data: response.data,
  });

  assert.equal(error.name, "OpenApiRequestError");
  assert.equal(error.message, "Invalid request");
  assert.equal(error.status, 400);
  assert.equal(error.statusText, "Bad Request");
  assert.equal(error.code, "BAD_REQUEST");
  assert.equal(error.response, response);
  assert.deepEqual(error.data, { field: "name" });
});

test("public types can be imported and composed without unsafe any", async () => {
  const response: ApiSuccessResponse<{ id: string }> = { error: 0, data: { id: "task-1" } };
  const task: AsyncTaskBase<"completed", { id: string }> = {
    taskId: "task-1",
    status: "completed",
    result: response.data,
  };
  const entity: EntityInput = { name: "BRCA1", aliases: ["RNF53"] };
  const file: FileInput = { data: new Uint8Array([1, 2, 3]), filename: "sample.bin" };
  const uploadOptions: UploadFileOptions = { fieldName: "file", contentType: "application/octet-stream" };
  const clientOptions: OpenApiClientOptions = {
    appKey: "key",
    appSecret: "secret",
    fetch: async () => new Response("{}", { headers: { "content-type": "application/json" } }),
  };

  assert.equal(task.result?.id, "task-1");
  assert.deepEqual(entity.aliases, ["RNF53"]);
  assert.equal(typeof file, "object");
  assert.equal(uploadOptions.fieldName, "file");
  assert.equal((await clientOptions.fetch?.("https://example.test"))?.ok, true);
});
