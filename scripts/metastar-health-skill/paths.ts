import { join } from "node:path";

import type { SkillFileOptions } from "./types.ts";

export const requiredSkillFiles = [
  "SKILL.md",
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
