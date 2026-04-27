import assert from "node:assert/strict";
import { test } from "node:test";

import { createUploadFormData, requestOpenApiUpload } from "./upload.ts";
import { OpenApiRequestError } from "./types.ts";
import type { OpenApiFetch } from "./types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function createJsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

test("createUploadFormData builds multipart data from an in-memory file", async () => {
  const formData = await createUploadFormData(
    { data: new Uint8Array([1, 2, 3]), filename: "sample.bin", contentType: "application/octet-stream" },
    { fieldName: "document" },
  );

  const file = formData.get("document");
  assert.ok(file instanceof Blob);
  assert.equal(file.size, 3);
});

test("requestOpenApiUpload sends multipart body, extra fields, query, and auth headers", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: OpenApiFetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ data: { taskId: "upload-1" }, error: 0 });
  };

  const result = await requestOpenApiUpload<{ data: { taskId: string }; error: 0 }>(
    "/upload",
    new Blob(["fake file"], { type: "text/plain" }),
    {
      appKey: "key",
      appSecret: "secret",
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      fieldName: "document",
      filename: "fake.txt",
      query: { source: "unit-test" },
      fields: { note: "safe", page: 1, ignored: undefined },
    },
  );

  assert.deepEqual(result, { data: { taskId: "upload-1" }, error: 0 });
  assert.equal(calls.length, 1);

  const [call] = calls;
  assert.equal(String(call.input), "https://api.example.test/upload?source=unit-test");
  assert.equal(call.init?.method, "POST");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("x-app-key"), "key");
  assert.equal(headers.get("x-app-secret"), "secret");
  assert.equal(headers.has("content-type"), false);

  assert.ok(call.init?.body instanceof FormData);
  assert.ok(call.init.body.get("document") instanceof Blob);
  assert.equal(call.init.body.get("note"), "safe");
  assert.equal(call.init.body.get("page"), "1");
  assert.equal(call.init.body.has("ignored"), false);
});

test("requestOpenApiUpload throws OpenApiRequestError for error responses", async () => {
  const fetchImpl: OpenApiFetch = async () => createJsonResponse(
    { data: { field: "file" }, error: "UPLOAD_FAILED", message: "Upload failed" },
    { status: 422, statusText: "Unprocessable Entity" },
  );

  await assert.rejects(
    requestOpenApiUpload("/upload", new Uint8Array([1]), {
      appKey: "key",
      appSecret: "secret",
      fetch: fetchImpl,
    }),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.status, 422);
      assert.equal(error.code, "UPLOAD_FAILED");
      assert.deepEqual(error.data, { field: "file" });
      return true;
    },
  );
});
