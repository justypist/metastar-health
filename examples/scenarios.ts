import { basicScenarios } from "./basic.ts";
import { literatureProcessScenarios } from "./literature-process.ts";
import { ocrAndTextExtractionScenarios } from "./ocr-and-text-extraction.ts";
import { syncApiScenarios } from "./sync-apis.ts";
import { uploadAndPollingScenarios } from "./upload-and-polling.ts";

export interface ExampleScenario {
  name: string;
  description: string;
  run: () => Promise<void>;
}

export const exampleScenarios: readonly ExampleScenario[] = [
  ...basicScenarios,
  ...uploadAndPollingScenarios,
  ...syncApiScenarios,
  ...ocrAndTextExtractionScenarios,
  ...literatureProcessScenarios,
];

export function listExampleScenarios(): readonly ExampleScenario[] {
  return exampleScenarios;
}

export function findExampleScenario(name: string): ExampleScenario | undefined {
  return exampleScenarios.find((scenario) => scenario.name === name);
}

export async function runExampleScenario(name: string): Promise<void> {
  const scenario = findExampleScenario(name);

  if (!scenario) {
    const available = exampleScenarios.map((item) => item.name).join(", ") || "none yet";
    throw new Error(`Unknown example scenario: ${name}. Available scenarios: ${available}`);
  }

  await scenario.run();
}
