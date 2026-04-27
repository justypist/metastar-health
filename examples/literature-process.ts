import {
  getLiteratureProcessResult,
  pollLiteratureProcessResult,
  submitLiteratureProcessTask,
} from "../api/index.ts";
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

function readLiteratureProcessTaskId(fallback: string): string {
  return process.env.OPEN_API_LITERATURE_PROCESS_TASK_ID ?? fallback;
}

export async function exampleSubmitLiteratureProcessTask(): Promise<void> {
  try {
    const context = readExampleContext();

    assertConfiguredValue("OPEN_API_UPLOAD_FILE_PATH", context.uploadFilePath, PLACEHOLDER_UPLOAD_FILE_PATH);

    const submission = await submitLiteratureProcessTask(context.uploadFilePath, {
      ...toOpenApiClientOptions(context),
      fieldName: "file",
      contentType: "application/pdf",
    });

    logExampleResult("submitLiteratureProcessTask", submission);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetLiteratureProcessResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readLiteratureProcessTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_LITERATURE_PROCESS_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await getLiteratureProcessResult(taskId, toOpenApiClientOptions(context));

    logExampleResult("getLiteratureProcessResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollLiteratureProcessResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readLiteratureProcessTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_LITERATURE_PROCESS_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await pollLiteratureProcessResult(taskId, {
      ...toOpenApiClientOptions(context),
      intervalMs: 5000,
      timeoutMs: 600000,
    });

    logExampleResult("pollLiteratureProcessResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export const literatureProcessScenarios: readonly ExampleScenario[] = [
  {
    name: "submit-literature-process-task",
    description: "Upload OPEN_API_UPLOAD_FILE_PATH to submit a literature process task.",
    run: exampleSubmitLiteratureProcessTask,
  },
  {
    name: "get-literature-process-result",
    description: "Fetch one literature process result by OPEN_API_LITERATURE_PROCESS_TASK_ID or OPEN_API_TASK_ID.",
    run: exampleGetLiteratureProcessResult,
  },
  {
    name: "poll-literature-process-result",
    description: "Poll one literature process task until completion or failure.",
    run: examplePollLiteratureProcessResult,
  },
];
