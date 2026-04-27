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

export function assertConfiguredValue(name: string, value: string, placeholder: string): void {
  if (value === placeholder) {
    throw new Error(`Set ${name} before running this example.`);
  }
}

export const MANUAL_EXECUTION_NOTE =
  "Importing examples is safe: no open API request, file read, or async task starts until a named example is called.";
