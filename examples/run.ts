import { fileURLToPath } from "node:url";

import { listExampleScenarios, runExampleScenario } from "./scenarios.ts";

function isDirectRun(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

function printUsage(): void {
  const scenarios = listExampleScenarios();
  const names = scenarios.length > 0 ? scenarios.map((scenario) => `- ${scenario.name}: ${scenario.description}`).join("\n") : "No scenarios registered yet.";

  console.info(`Usage: node examples/run.ts <scenario-name>\n\n${names}`);
}

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const [name] = args;

  if (!name) {
    printUsage();
    return;
  }

  await runExampleScenario(name);
}

if (isDirectRun()) {
  await main();
}
