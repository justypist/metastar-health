import { join } from "node:path";

import type { SkillFileOptions } from "./types.ts";

export const requiredSkillFiles = [
  "SKILL.md",
  "scripts/index.ts",
  "scripts/autocomplete.ts",
  "scripts/client.ts",
  "scripts/config.ts",
  "scripts/drugs.ts",
  "scripts/gbd.ts",
  "scripts/hpa.ts",
  "scripts/literature-process.ts",
  "scripts/ocr.ts",
  "scripts/papers.ts",
  "scripts/polling.ts",
  "scripts/preclinical-literature.ts",
  "scripts/target-assistant.ts",
  "scripts/target-quick-assessment.ts",
  "scripts/text-extraction.ts",
  "scripts/tools.ts",
  "scripts/types.ts",
  "scripts/upload.ts",
  "references/overview.md",
  "references/sync-search.md",
  "references/async-doc-processing.md",
  "references/target-workflows.md",
  "references/api-map.md",
] as const;

export function resolveSkillDir(options: SkillFileOptions): string {
  if (options.skillDir) {
    return options.skillDir;
  }

  return join(options.cwd ?? process.cwd(), ".agents/skills/metastar-health");
}
