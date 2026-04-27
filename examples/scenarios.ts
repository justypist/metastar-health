import { basicScenarios } from "./basic.ts";

export interface ExampleScenario {
  name: string;
  description: string;
  run: () => Promise<void>;
}

export const exampleScenarios: readonly ExampleScenario[] = [...basicScenarios];

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
