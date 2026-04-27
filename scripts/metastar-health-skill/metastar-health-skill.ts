import { fileURLToPath } from "node:url";

import { generateSkillFiles } from "./generate.ts";
import { validateSkillStructure } from "./validate.ts";

export { generateSkillFiles } from "./generate.ts";
export { buildApiMapMarkdown, buildSkillDescription, replaceGeneratedBlock } from "./render.ts";
export { parseApiIndexExports, parseExportedFunctions, scanApiCapabilities } from "./scan.ts";
export { validateSkillStructure } from "./validate.ts";
export type {
  ApiCapabilityScanResult,
  CapabilityCategory,
  CapabilityMetadata,
  ModuleExportInfo,
  SkillFileOptions,
  SkillGenerationResult,
  SkillStructureValidationResult,
} from "./types.ts";

function runCli(): void {
  const check = process.argv.includes("--check");
  const result = generateSkillFiles({ check });
  const action = check ? "checked" : "updated";

  if (check) {
    validateSkillStructure();
  }

  if (result.changedFiles.length === 0) {
    console.log(`metastar-health SKILL metadata ${action}; no changes needed.`);
    return;
  }

  console.log(`metastar-health SKILL metadata ${action}:`);
  for (const changedFile of result.changedFiles) {
    console.log(`- ${changedFile}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
