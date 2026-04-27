import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import {
  assertSuccessfulOpenApiResponse,
  buildOpenApiUrl,
  getOpenApiFetch,
  parseOpenApiResponsePayload,
} from "./client.ts";
import { readOpenApiConfig } from "./config.ts";
import type { QueryParams } from "./client.ts";
import type { FileInput, OpenApiClientOptions, UploadFileOptions } from "./types.ts";

export interface OpenApiUploadRequestOptions extends OpenApiClientOptions, UploadFileOptions {
  query?: QueryParams;
  fields?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

interface PreparedFile {
  value: Blob;
  filename: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNamedFileData(value: FileInput): value is Extract<FileInput, { data: unknown }> {
  return isRecord(value) && "data" in value;
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

async function preparePathFile(path: string | URL, options: UploadFileOptions): Promise<PreparedFile> {
  const filePath = path instanceof URL ? path : new URL(path, "file://");
  const bytes = await readFile(filePath);

  return {
    value: new Blob([bytes], { type: options.contentType ?? "application/octet-stream" }),
    filename: options.filename ?? basename(filePath.pathname),
  };
}

async function prepareFileInput(input: FileInput, options: UploadFileOptions): Promise<PreparedFile> {
  if (typeof input === "string" || input instanceof URL) {
    return preparePathFile(input, options);
  }

  if (isNamedFileData(input)) {
    const value = isBlob(input.data)
      ? input.data
      : new Blob([input.data], { type: input.contentType ?? options.contentType ?? "application/octet-stream" });

    return {
      value,
      filename: input.filename ?? options.filename ?? "upload.bin",
    };
  }

  if (isFile(input)) {
    return {
      value: input,
      filename: options.filename ?? input.name,
    };
  }

  if (isBlob(input)) {
    return {
      value: input,
      filename: options.filename ?? "upload.bin",
    };
  }

  return {
    value: new Blob([input], { type: options.contentType ?? "application/octet-stream" }),
    filename: options.filename ?? "upload.bin",
  };
}

export async function createUploadFormData(file: FileInput, options: UploadFileOptions = {}): Promise<FormData> {
  const formData = new FormData();
  const prepared = await prepareFileInput(file, options);

  formData.append(options.fieldName ?? "file", prepared.value, prepared.filename);

  return formData;
}

export async function requestOpenApiUpload<TResponse>(
  path: string,
  file: FileInput,
  options: OpenApiUploadRequestOptions = {},
): Promise<TResponse> {
  const config = readOpenApiConfig(options);
  const fetchImpl = getOpenApiFetch(options.fetch);
  const url = buildOpenApiUrl(config.baseUrl, path, options.query);
  const headers = new Headers(options.headers);
  const formData = await createUploadFormData(file, options);

  headers.set("x-app-key", config.appKey);
  headers.set("x-app-secret", config.appSecret);

  for (const [key, value] of Object.entries(options.fields ?? {})) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers,
    body: formData,
    signal: options.signal,
  });
  const payload = await parseOpenApiResponsePayload(response);

  assertSuccessfulOpenApiResponse(response, payload);

  return payload as TResponse;
}
