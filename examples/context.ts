import { OpenApiRequestError } from "../api/index.ts";

export interface ExampleContext {
  appKey: string;
  appSecret: string;
  baseUrl?: string;
  uploadFilePath: string;
  taskId: string;
}

export const PLACEHOLDER_UPLOAD_FILE_PATH = "/path/to/local/business-file.pdf";
export const PLACEHOLDER_TASK_ID = "replace-with-task-id";

export function readExampleContext(): ExampleContext {
  const appKey = process.env.APP_KEY;
  const appSecret = process.env.APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("Set APP_KEY and APP_SECRET before running an open API example.");
  }

  return {
    appKey,
    appSecret,
    baseUrl: process.env.OPEN_API_BASE_URL,
    uploadFilePath: process.env.OPEN_API_UPLOAD_FILE_PATH ?? PLACEHOLDER_UPLOAD_FILE_PATH,
    taskId: process.env.OPEN_API_TASK_ID ?? PLACEHOLDER_TASK_ID,
  };
}

export function exampleClientOptions(context: ExampleContext): Pick<ExampleContext, "appKey" | "appSecret" | "baseUrl"> {
  return {
    appKey: context.appKey,
    appSecret: context.appSecret,
    baseUrl: context.baseUrl,
  };
}

export function exampleAuthHeaders(context: ExampleContext): Headers {
  return new Headers({
    "x-app-key": context.appKey,
    "x-app-secret": context.appSecret,
  });
}

export function assertConfiguredValue(name: string, value: string, placeholder: string): void {
  if (value === placeholder) {
    throw new Error(`Set ${name} before running this example.`);
  }
}

export function logExampleResult(name: string, result: unknown): void {
  console.info(`${name} result:`);
  console.info(result);
}

export function handleExampleError(error: unknown): never {
  if (error instanceof OpenApiRequestError) {
    console.error("Open API request failed:", {
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      data: error.data,
    });
    throw error;
  }

  console.error("Example failed:", error);
  throw error;
}

export const MANUAL_EXECUTION_NOTE =
  "Importing examples is safe: no open API request, file read, or async task starts until a named example is called.";
