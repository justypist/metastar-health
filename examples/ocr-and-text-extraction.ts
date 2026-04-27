import {
  getOcrResult,
  getTextExtractionResult,
  pollOcrResult,
  pollTextExtractionResult,
  submitOcrTask,
  submitTextExtractionTask,
} from "../api/index.ts";
import {
  PLACEHOLDER_TASK_ID,
  PLACEHOLDER_UPLOAD_FILE_PATH,
  assertConfiguredValue,
  exampleClientOptions,
  handleExampleError,
  logExampleResult,
  readExampleContext,
} from "./context.ts";
import type { ExampleScenario } from "./scenarios.ts";

function readTaskId(envName: string, fallback: string): string {
  return process.env[envName] ?? fallback;
}

export async function exampleSubmitOcrTask(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_UPLOAD_FILE_PATH", context.uploadFilePath, PLACEHOLDER_UPLOAD_FILE_PATH);

    const submission = await submitOcrTask(context.uploadFilePath, {
      ...exampleClientOptions(context),
      fieldName: "file",
      contentType: "application/pdf",
    });

    logExampleResult("submitOcrTask", submission);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetOcrResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTaskId("OPEN_API_OCR_TASK_ID", context.taskId);

    assertConfiguredValue("OPEN_API_OCR_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await getOcrResult(taskId, exampleClientOptions(context));

    logExampleResult("getOcrResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollOcrResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTaskId("OPEN_API_OCR_TASK_ID", context.taskId);

    assertConfiguredValue("OPEN_API_OCR_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await pollOcrResult(taskId, {
      ...exampleClientOptions(context),
      intervalMs: 5000,
      timeoutMs: 600000,
    });

    logExampleResult("pollOcrResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSubmitTextExtractionTask(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_UPLOAD_FILE_PATH", context.uploadFilePath, PLACEHOLDER_UPLOAD_FILE_PATH);

    const submission = await submitTextExtractionTask(context.uploadFilePath, {
      ...exampleClientOptions(context),
      fieldName: "file",
      contentType: "application/pdf",
    });

    logExampleResult("submitTextExtractionTask", submission);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetTextExtractionResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTaskId("OPEN_API_TEXT_EXTRACTION_TASK_ID", context.taskId);

    assertConfiguredValue("OPEN_API_TEXT_EXTRACTION_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await getTextExtractionResult(taskId, exampleClientOptions(context));

    logExampleResult("getTextExtractionResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollTextExtractionResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTaskId("OPEN_API_TEXT_EXTRACTION_TASK_ID", context.taskId);

    assertConfiguredValue("OPEN_API_TEXT_EXTRACTION_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await pollTextExtractionResult(taskId, {
      ...exampleClientOptions(context),
      intervalMs: 5000,
      timeoutMs: 600000,
    });

    logExampleResult("pollTextExtractionResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export const ocrAndTextExtractionScenarios: readonly ExampleScenario[] = [
  {
    name: "submit-ocr-task",
    description: "Upload OPEN_API_UPLOAD_FILE_PATH to submit an OCR task.",
    run: exampleSubmitOcrTask,
  },
  {
    name: "get-ocr-result",
    description: "Fetch one OCR task result by OPEN_API_OCR_TASK_ID or OPEN_API_TASK_ID.",
    run: exampleGetOcrResult,
  },
  {
    name: "poll-ocr-result",
    description: "Poll one OCR task until completion or failure.",
    run: examplePollOcrResult,
  },
  {
    name: "submit-text-extraction-task",
    description: "Upload OPEN_API_UPLOAD_FILE_PATH to submit a text extraction task.",
    run: exampleSubmitTextExtractionTask,
  },
  {
    name: "get-text-extraction-result",
    description: "Fetch one text extraction result by OPEN_API_TEXT_EXTRACTION_TASK_ID or OPEN_API_TASK_ID.",
    run: exampleGetTextExtractionResult,
  },
  {
    name: "poll-text-extraction-result",
    description: "Poll one text extraction task until completion or failure.",
    run: examplePollTextExtractionResult,
  },
];
