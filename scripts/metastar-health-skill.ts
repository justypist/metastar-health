import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

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

const capabilityMetadataByModule = new Map(capabilityMetadata.map((metadata) => [metadata.moduleName, metadata]));

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
