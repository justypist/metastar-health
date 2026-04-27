import type { ApiCapabilityScanResult } from "./types.ts";

export const skillDescriptionBeginMarker = "# BEGIN GENERATED description";
export const skillDescriptionEndMarker = "# END GENERATED description";
export const apiMapBeginMarker = "<!-- BEGIN GENERATED api-map -->";
export const apiMapEndMarker = "<!-- END GENERATED api-map -->";

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
