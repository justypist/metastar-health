import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

import { capabilityMetadataByModule, infrastructureModuleNames } from "./metadata.ts";
import type { ApiCapabilityScanResult } from "./types.ts";

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
