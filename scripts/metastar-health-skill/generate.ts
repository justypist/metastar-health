import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  apiMapBeginMarker,
  apiMapEndMarker,
  buildApiMapMarkdown,
  buildSkillDescription,
  replaceGeneratedBlock,
  skillDescriptionBeginMarker,
  skillDescriptionEndMarker,
} from "./render.ts";
import { resolveSkillDir } from "./paths.ts";
import { scanApiCapabilities } from "./scan.ts";
import type { SkillFileOptions, SkillGenerationResult } from "./types.ts";

export function generateSkillFiles(options: { check?: boolean } & SkillFileOptions = {}): SkillGenerationResult {
  const cwd = options.cwd ?? process.cwd();
  const skillDir = resolveSkillDir(options);
  const check = options.check ?? false;
  const scanResult = scanApiCapabilities(join(cwd, "api/index.ts"));
  const updates = [
    {
      path: join(skillDir, "SKILL.md"),
      beginMarker: skillDescriptionBeginMarker,
      endMarker: skillDescriptionEndMarker,
      content: `description: ${JSON.stringify(buildSkillDescription(scanResult))}`,
    },
    {
      path: join(skillDir, "references/api-map.md"),
      beginMarker: apiMapBeginMarker,
      endMarker: apiMapEndMarker,
      content: buildApiMapMarkdown(scanResult),
    },
  ];
  const changedFiles: string[] = [];

  for (const update of updates) {
    const source = readFileSync(update.path, "utf8");
    const nextSource = replaceGeneratedBlock(source, update.beginMarker, update.endMarker, update.content);
    if (source !== nextSource) {
      changedFiles.push(update.path);
      if (!check) {
        writeFileSync(update.path, nextSource);
      }
    }
  }

  if (check && changedFiles.length > 0) {
    throw new Error("metastar-health SKILL metadata is out of date. Run: pnpm skill:generate");
  }

  return { checked: check, changedFiles };
}
