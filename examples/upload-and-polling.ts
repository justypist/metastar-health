import { createUploadFormData, pollAsyncTask, requestOpenApiData, requestOpenApiUpload } from "../api/index.ts";
import {
  PLACEHOLDER_TASK_ID,
  PLACEHOLDER_UPLOAD_FILE_PATH,
  assertConfiguredValue,
  handleExampleError,
  logExampleResult,
  readExampleContext,
  toOpenApiClientOptions,
} from "./context.ts";
import type { ExampleScenario } from "./scenarios.ts";
import type { ApiSuccessResponse, OcrTaskResult, TaskSubmission } from "../api/index.ts";

export async function exampleCreateUploadFormData(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_UPLOAD_FILE_PATH", context.uploadFilePath, PLACEHOLDER_UPLOAD_FILE_PATH);

    const formData = await createUploadFormData(context.uploadFilePath, {
      fieldName: "file",
      contentType: "application/pdf",
    });

    logExampleResult("createUploadFormData", Array.from(formData.keys()));
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleRequestOpenApiUpload(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_UPLOAD_FILE_PATH", context.uploadFilePath, PLACEHOLDER_UPLOAD_FILE_PATH);

    const response = await requestOpenApiUpload<ApiSuccessResponse<TaskSubmission>>(
      "/api/ocr/submit",
      context.uploadFilePath,
      {
        ...toOpenApiClientOptions(context),
        fieldName: "file",
        contentType: "application/pdf",
      },
    );

    logExampleResult("requestOpenApiUpload", response);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollAsyncTask(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_TASK_ID", context.taskId, PLACEHOLDER_TASK_ID);

    const clientOptions = toOpenApiClientOptions(context);
    const result = await pollAsyncTask<OcrTaskResult>(
      () => requestOpenApiData<OcrTaskResult>(`/api/ocr/result/${encodeURIComponent(context.taskId)}`, clientOptions),
      {
        intervalMs: 5000,
        timeoutMs: 600000,
      },
    );

    logExampleResult("pollAsyncTask", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export const uploadAndPollingScenarios: readonly ExampleScenario[] = [
  {
    name: "create-upload-form-data",
    description: "Read OPEN_API_UPLOAD_FILE_PATH and build multipart form data for upload.",
    run: exampleCreateUploadFormData,
  },
  {
    name: "request-open-api-upload",
    description: "Upload OPEN_API_UPLOAD_FILE_PATH to the OCR submit endpoint.",
    run: exampleRequestOpenApiUpload,
  },
  {
    name: "poll-async-task",
    description: "Poll OPEN_API_TASK_ID with the generic async task polling helper.",
    run: examplePollAsyncTask,
  },
];
