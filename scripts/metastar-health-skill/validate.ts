import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { requiredSkillFiles, resolveSkillDir } from "./paths.ts";
import type { SkillFileOptions, SkillStructureValidationResult } from "./types.ts";

function assertDoesNotContainSecrets(relativePath: string, source: string): void {
  const secretPatterns = [
    /appKey\s*[:=]\s*["'][^"']{8,}["']/iu,
    /appSecret\s*[:=]\s*["'][^"']{8,}["']/iu,
    /APP_KEY\s*=\s*(?!<|\$|APP_KEY|your-|example)[^\s]+/iu,
    /APP_SECRET\s*=\s*(?!<|\$|APP_SECRET|your-|example)[^\s]+/iu,
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(source)) {
      throw new Error(`Potential real credential found in ${relativePath}`);
    }
  }
}

function assertDoesNotReferenceExternalPaths(relativePath: string, source: string): void {
  const forbiddenPatterns = [/\.agents\/skills/u, /api\/index\.ts/u, /\.\.\//u, /\/home\//u, /生产服务器/u, /源码仓库/u, /项目根目录/u];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      throw new Error(`External or deployment-specific path reference found in ${relativePath}`);
    }
  }
}

export function validateSkillStructure(options: SkillFileOptions = {}): SkillStructureValidationResult {
  const skillDir = resolveSkillDir(options);
  const checkedFiles: string[] = [];

  for (const requiredFile of requiredSkillFiles) {
    const fullPath = join(skillDir, requiredFile);
    const source = readFileSync(fullPath, "utf8");
    checkedFiles.push(fullPath);
    assertDoesNotContainSecrets(requiredFile, source);
    assertDoesNotReferenceExternalPaths(requiredFile, source);
  }

  const skillPath = join(skillDir, "SKILL.md");
  const skillSource = readFileSync(skillPath, "utf8");
  const skillLines = skillSource.split("\n").length;
  if (skillLines > 80) {
    throw new Error(`SKILL.md should stay concise; found ${skillLines} lines.`);
  }
  if (!skillSource.includes("不得自动访问真实网络")) {
    throw new Error("SKILL.md must explicitly forbid default real network access.");
  }
  if (!skillSource.includes("references/api-map.md")) {
    throw new Error("SKILL.md must route users to references/api-map.md.");
  }

  const referenceSafetyFiles = ["overview.md", "sync-search.md", "async-doc-processing.md", "target-workflows.md"];
  for (const fileName of referenceSafetyFiles) {
    const fullPath = join(skillDir, "references", fileName);
    const source = readFileSync(fullPath, "utf8");
    if (!/(授权|手动调用|不得自动|只有用户明确)/u.test(source)) {
      throw new Error(`${relative(skillDir, fullPath)} must describe manual authorization or no-default-network behavior.`);
    }
  }

  return { checkedFiles };
}
