import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";

export type CapabilityCategory = "sync-search" | "async-doc-processing" | "target-workflows";

export interface CapabilityMetadata {
  moduleName: string;
  title: string;
  category: CapabilityCategory;
  referenceFile: string;
  descriptionTopic: string;
}

export interface ModuleExportInfo {
  moduleName: string;
  exportPath: string;
  functions: string[];
}

export interface ApiCapabilityScanResult {
  exportedModules: ModuleExportInfo[];
  businessCapabilities: Array<CapabilityMetadata & { functions: string[] }>;
  infrastructureModules: ModuleExportInfo[];
  modulesWithoutMetadata: ModuleExportInfo[];
}

export interface SkillGenerationResult {
  checked: boolean;
  changedFiles: string[];
}

export interface SkillStructureValidationResult {
  checkedFiles: string[];
}

export const capabilityMetadata = [
  {
    moduleName: "autocomplete",
    title: "实体补全",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "实体补全",
  },
  {
    moduleName: "drugs",
    title: "药物搜索",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "药物搜索",
  },
  {
    moduleName: "gbd",
    title: "GBD 疾病负担查询",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "GBD 查询",
  },
  {
    moduleName: "hpa",
    title: "HPA 靶点画像",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "HPA 画像",
  },
  {
    moduleName: "literature-process",
    title: "文献解析",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "文献解析",
  },
  {
    moduleName: "ocr",
    title: "OCR 文档识别",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "OCR",
  },
  {
    moduleName: "papers",
    title: "论文搜索",
    category: "sync-search",
    referenceFile: "references/sync-search.md",
    descriptionTopic: "论文搜索",
  },
  {
    moduleName: "target-assistant",
    title: "靶点助手",
    category: "target-workflows",
    referenceFile: "references/target-workflows.md",
    descriptionTopic: "靶点助手",
  },
  {
    moduleName: "target-quick-assessment",
    title: "靶点快速评估",
    category: "target-workflows",
    referenceFile: "references/target-workflows.md",
    descriptionTopic: "靶点快速评估",
  },
  {
    moduleName: "text-extraction",
    title: "临床前文本提取",
    category: "async-doc-processing",
    referenceFile: "references/async-doc-processing.md",
    descriptionTopic: "临床前文本提取",
  },
] as const satisfies readonly CapabilityMetadata[];

const infrastructureModuleNames = new Set(["client", "config", "polling", "types", "upload"]);

const capabilityMetadataByModule: ReadonlyMap<string, CapabilityMetadata> = new Map(
  capabilityMetadata.map((metadata): [string, CapabilityMetadata] => [metadata.moduleName, metadata]),
);
const skillDescriptionBeginMarker = "# BEGIN GENERATED description";
const skillDescriptionEndMarker = "# END GENERATED description";
const apiMapBeginMarker = "<!-- BEGIN GENERATED api-map -->";
const apiMapEndMarker = "<!-- END GENERATED api-map -->";
const requiredSkillFiles = [
  ".agents/skills/metastar-health/SKILL.md",
  ".agents/skills/metastar-health/references/overview.md",
  ".agents/skills/metastar-health/references/sync-search.md",
  ".agents/skills/metastar-health/references/async-doc-processing.md",
  ".agents/skills/metastar-health/references/target-workflows.md",
  ".agents/skills/metastar-health/references/api-map.md",
] as const;

export function parseApiIndexExports(source: string): Array<{ moduleName: string; exportPath: string }> {
  const exports: Array<{ moduleName: string; exportPath: string }> = [];
  const exportPattern = /^export\s+\*\s+from\s+["'](?<exportPath>\.\/(?<moduleName>[a-z0-9-]+)\.ts)["'];?$/gmu;

  for (const match of source.matchAll(exportPattern)) {
    const groups = match.groups;
    if (groups) {
      exports.push({ moduleName: groups.moduleName, exportPath: groups.exportPath });
    }
  }

  return exports;
}

export function parseExportedFunctions(source: string): string[] {
  const functions: string[] = [];
  const functionPattern = /^export\s+(?:async\s+)?function\s+(?<functionName>[A-Za-z_$][\w$]*)\s*\(/gmu;

  for (const match of source.matchAll(functionPattern)) {
    const functionName = match.groups?.functionName;
    if (functionName) {
      functions.push(functionName);
    }
  }

  return functions;
}

export function scanApiCapabilities(indexPath = join(process.cwd(), "api/index.ts")): ApiCapabilityScanResult {
  const apiDir = dirname(indexPath);
  const indexSource = readFileSync(indexPath, "utf8");
  const exportedModules = parseApiIndexExports(indexSource).map(({ moduleName, exportPath }) => {
    const moduleSource = readFileSync(join(apiDir, `${moduleName}.ts`), "utf8");

    return {
      moduleName,
      exportPath,
      functions: parseExportedFunctions(moduleSource),
    };
  });

  const businessCapabilities = exportedModules.flatMap((moduleInfo) => {
    const metadata = capabilityMetadataByModule.get(moduleInfo.moduleName);
    return metadata ? [{ ...metadata, functions: moduleInfo.functions }] : [];
  });
  const infrastructureModules = exportedModules.filter((moduleInfo) => infrastructureModuleNames.has(moduleInfo.moduleName));
  const modulesWithoutMetadata = exportedModules.filter(
    (moduleInfo) => !capabilityMetadataByModule.has(moduleInfo.moduleName) && !infrastructureModuleNames.has(moduleInfo.moduleName),
  );

  return {
    exportedModules,
    businessCapabilities,
    infrastructureModules,
    modulesWithoutMetadata,
  };
}

export function buildSkillDescription(scanResult: ApiCapabilityScanResult): string {
  const topics = scanResult.businessCapabilities.map((capability) => capability.descriptionTopic);

  return `使用 MetaStar Health 开放 API 进行研究任务，按需调用${topics.join("、")}能力。`;
}

export function buildApiMapMarkdown(scanResult: ApiCapabilityScanResult): string {
  const lines = [
    "| 业务模块 | 能力 | 参考文档 | 公共函数 |",
    "| --- | --- | --- | --- |",
    ...scanResult.businessCapabilities.map((capability) => {
      const functions = capability.functions.map((functionName) => `\`${functionName}\``).join(", ");
      return `| \`${capability.moduleName}\` | ${capability.title} | \`${capability.referenceFile}\` | ${functions || "-"} |`;
    }),
  ];

  return lines.join("\n");
}

export function replaceGeneratedBlock(source: string, beginMarker: string, endMarker: string, generatedContent: string): string {
  const beginIndex = source.indexOf(beginMarker);
  const endIndex = source.indexOf(endMarker);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(`Missing generated markers: ${beginMarker} / ${endMarker}`);
  }

  const beforeContentStart = source.indexOf("\n", beginIndex);
  if (beforeContentStart === -1) {
    throw new Error(`Generated begin marker must be on its own line: ${beginMarker}`);
  }

  const afterContentEnd = source.lastIndexOf("\n", endIndex);
  if (afterContentEnd === -1 || afterContentEnd < beforeContentStart) {
    throw new Error(`Generated end marker must be on its own line: ${endMarker}`);
  }

  return `${source.slice(0, beforeContentStart + 1)}${generatedContent}\n${source.slice(afterContentEnd + 1)}`;
}

export function generateSkillFiles(options: { check?: boolean; cwd?: string } = {}): SkillGenerationResult {
  const cwd = options.cwd ?? process.cwd();
  const check = options.check ?? false;
  const scanResult = scanApiCapabilities(join(cwd, "api/index.ts"));
  const updates = [
    {
      path: join(cwd, ".agents/skills/metastar-health/SKILL.md"),
      beginMarker: skillDescriptionBeginMarker,
      endMarker: skillDescriptionEndMarker,
      content: `description: ${JSON.stringify(buildSkillDescription(scanResult))}`,
    },
    {
      path: join(cwd, ".agents/skills/metastar-health/references/api-map.md"),
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
    throw new Error(`metastar-health SKILL metadata is out of date. Run: node scripts/metastar-health-skill.ts`);
  }

  return { checked: check, changedFiles };
}

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

export function validateSkillStructure(options: { cwd?: string } = {}): SkillStructureValidationResult {
  const cwd = options.cwd ?? process.cwd();
  const checkedFiles: string[] = [];

  for (const requiredFile of requiredSkillFiles) {
    const fullPath = join(cwd, requiredFile);
    const source = readFileSync(fullPath, "utf8");
    checkedFiles.push(fullPath);
    assertDoesNotContainSecrets(requiredFile, source);
  }

  const skillPath = join(cwd, ".agents/skills/metastar-health/SKILL.md");
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
    const fullPath = join(cwd, ".agents/skills/metastar-health/references", fileName);
    const source = readFileSync(fullPath, "utf8");
    if (!/(授权|手动调用|不得自动|只有用户明确)/u.test(source)) {
      throw new Error(`${relative(cwd, fullPath)} must describe manual authorization or no-default-network behavior.`);
    }
  }

  return { checkedFiles };
}

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
