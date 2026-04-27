import assert from "node:assert/strict";
import { test } from "node:test";

import { pollAsyncTask } from "./polling.ts";
import { OpenApiRequestError } from "./types.ts";

interface TestTask {
  taskId: string;
  status: "pending" | "completed" | "failed";
  error?: string;
}

test("pollAsyncTask returns completed task", async () => {
  const task: TestTask = { taskId: "task-1", status: "completed" };

  assert.equal(await pollAsyncTask(async () => task), task);
});

test("pollAsyncTask throws OpenApiRequestError when task fails", async () => {
  const task: TestTask = { taskId: "task-1", status: "failed", error: "Worker failed" };

  await assert.rejects(
    pollAsyncTask(async () => task),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.code, "TASK_FAILED");
      assert.equal(error.message, "Worker failed");
      assert.equal(error.data, task);
      return true;
    },
  );
});

test("pollAsyncTask throws timeout without waiting when timeout is already exceeded", async () => {
  let calls = 0;

  await assert.rejects(
    pollAsyncTask(
      async () => {
        calls += 1;
        return { taskId: "task-1", status: "pending" } satisfies TestTask;
      },
      { timeoutMs: -1, intervalMs: 1 },
    ),
    (error: unknown) => {
      assert.ok(error instanceof OpenApiRequestError);
      assert.equal(error.code, "POLL_TIMEOUT");
      return true;
    },
  );
  assert.equal(calls, 0);
});

test("pollAsyncTask rejects with abort reason before waiting", async () => {
  const controller = new AbortController();
  controller.abort(new Error("stop polling"));

  await assert.rejects(
    pollAsyncTask(async () => ({ taskId: "task-1", status: "pending" }), {
      intervalMs: 1,
      timeoutMs: 100,
      signal: controller.signal,
    }),
    /stop polling/,
  );
});
