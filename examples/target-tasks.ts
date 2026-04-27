import {
  getTargetAssistantResult,
  getTargetQuickAssessmentResult,
  pollTargetAssistantResult,
  pollTargetQuickAssessmentResult,
  submitTargetAssistantTask,
  submitTargetQuickAssessmentTask,
} from "../api/index.ts";
import {
  PLACEHOLDER_TASK_ID,
  assertConfiguredValue,
  exampleClientOptions,
  handleExampleError,
  logExampleResult,
  readExampleContext,
} from "./context.ts";
import type { ExampleScenario } from "./scenarios.ts";

function readTargetAssistantTaskId(fallback: string): string {
  return process.env.OPEN_API_TARGET_ASSISTANT_TASK_ID ?? fallback;
}

function readTargetQuickAssessmentTaskId(fallback: string): string {
  return process.env.OPEN_API_TARGET_QUICK_ASSESSMENT_TASK_ID ?? fallback;
}

export async function exampleSubmitTargetAssistantTask(): Promise<void> {
  try {
    const context = readExampleContext();
    const submission = await submitTargetAssistantTask(
      {
        targetEntity: {
          name: "EGFR",
          aliases: ["ERBB1"],
        },
        language: "en-US",
      },
      exampleClientOptions(context),
    );

    logExampleResult("submitTargetAssistantTask", submission);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetTargetAssistantResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTargetAssistantTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_TARGET_ASSISTANT_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await getTargetAssistantResult(taskId, exampleClientOptions(context));

    logExampleResult("getTargetAssistantResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollTargetAssistantResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTargetAssistantTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_TARGET_ASSISTANT_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await pollTargetAssistantResult(taskId, {
      ...exampleClientOptions(context),
      intervalMs: 5000,
      timeoutMs: 600000,
    });

    logExampleResult("pollTargetAssistantResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleSubmitTargetQuickAssessmentTask(): Promise<void> {
  try {
    const context = readExampleContext();
    const submission = await submitTargetQuickAssessmentTask(
      {
        targetNames: ["EGFR", "ALK"],
      },
      exampleClientOptions(context),
    );

    logExampleResult("submitTargetQuickAssessmentTask", submission);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function exampleGetTargetQuickAssessmentResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTargetQuickAssessmentTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_TARGET_QUICK_ASSESSMENT_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await getTargetQuickAssessmentResult(taskId, exampleClientOptions(context));

    logExampleResult("getTargetQuickAssessmentResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export async function examplePollTargetQuickAssessmentResult(): Promise<void> {
  try {
    const context = readExampleContext();
    const taskId = readTargetQuickAssessmentTaskId(context.taskId);

    assertConfiguredValue("OPEN_API_TARGET_QUICK_ASSESSMENT_TASK_ID or OPEN_API_TASK_ID", taskId, PLACEHOLDER_TASK_ID);

    const result = await pollTargetQuickAssessmentResult(taskId, {
      ...exampleClientOptions(context),
      intervalMs: 5000,
      timeoutMs: 600000,
    });

    logExampleResult("pollTargetQuickAssessmentResult", result);
  } catch (error) {
    handleExampleError(error);
  }
}

export const targetTaskScenarios: readonly ExampleScenario[] = [
  {
    name: "submit-target-assistant-task",
    description: "Submit an EGFR target assistant task.",
    run: exampleSubmitTargetAssistantTask,
  },
  {
    name: "get-target-assistant-result",
    description: "Fetch one target assistant result by OPEN_API_TARGET_ASSISTANT_TASK_ID or OPEN_API_TASK_ID.",
    run: exampleGetTargetAssistantResult,
  },
  {
    name: "poll-target-assistant-result",
    description: "Poll one target assistant task until completion or failure.",
    run: examplePollTargetAssistantResult,
  },
  {
    name: "submit-target-quick-assessment-task",
    description: "Submit a quick assessment task for EGFR and ALK.",
    run: exampleSubmitTargetQuickAssessmentTask,
  },
  {
    name: "get-target-quick-assessment-result",
    description: "Fetch one quick assessment result by OPEN_API_TARGET_QUICK_ASSESSMENT_TASK_ID or OPEN_API_TASK_ID.",
    run: exampleGetTargetQuickAssessmentResult,
  },
  {
    name: "poll-target-quick-assessment-result",
    description: "Poll one quick assessment task until completion or failure.",
    run: examplePollTargetQuickAssessmentResult,
  },
];
