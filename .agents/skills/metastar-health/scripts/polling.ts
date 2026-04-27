import { OpenApiRequestError } from "./types.ts";
import type { PollOptions } from "./types.ts";

export interface AsyncPollOptions extends PollOptions {
  completedStatuses?: readonly string[];
  failedStatuses?: readonly string[];
}

const DEFAULT_COMPLETED_STATUSES = ["completed"] as const;
const DEFAULT_FAILED_STATUSES = ["failed"] as const;

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export async function pollAsyncTask<TTask extends { taskId: string; status: string; error?: string }>(
  getTask: () => Promise<TTask>,
  options: AsyncPollOptions = {},
): Promise<TTask> {
  const intervalMs = options.intervalMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 600000;
  const completedStatuses = options.completedStatuses ?? DEFAULT_COMPLETED_STATUSES;
  const failedStatuses = options.failedStatuses ?? DEFAULT_FAILED_STATUSES;
  const start = Date.now();

  while (Date.now() - start <= timeoutMs) {
    const task = await getTask();

    if (completedStatuses.includes(task.status)) {
      return task;
    }

    if (failedStatuses.includes(task.status)) {
      throw new OpenApiRequestError({
        code: "TASK_FAILED",
        message: task.error ?? `Task ${task.taskId} failed.`,
        data: task,
      });
    }

    await wait(intervalMs, options.signal);
  }

  throw new OpenApiRequestError({
    code: "POLL_TIMEOUT",
    message: `Task polling timed out after ${timeoutMs}ms.`,
  });
}
