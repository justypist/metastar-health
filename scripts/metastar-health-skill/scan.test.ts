import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";

import { buildApiMapMarkdown, buildSkillDescription } from "./render.ts";
import { parseApiIndexExports, scanApiCapabilities } from "./scan.ts";
import { withFixture } from "./test-fixture.ts";

test("parseApiIndexExports reads public module exports", () => {
  assert.deepEqual(parseApiIndexExports('export * from "./papers.ts";\nexport * from "./client.ts";'), [
    { moduleName: "papers", exportPath: "./papers.ts" },
    { moduleName: "client", exportPath: "./client.ts" },
  ]);
});

test("parseExportedFunctions reads plain, async, and generic function exports", async () => {
  const { parseExportedFunctions } = await import("./scan.ts");

  assert.deepEqual(
    parseExportedFunctions(
      [
        "export function searchPapers(): void {}",
        "export async function submitOcrTask(): Promise<void> {}",
        "export function executeTool<TData = unknown>(toolName: string): Promise<TData> {}",
        "export const openApiToolNames = [];",
      ].join("\n"),
    ),
    ["searchPapers", "submitOcrTask", "executeTool"],
  );
});

test("scanApiCapabilities identifies business modules and exported functions", () => {
  withFixture(
    {
      modules: {
        client: "export function requestOpenApi(): void {}\n",
        papers: "export function searchPapers(): void {}\nexport async function getPapersHealth(): Promise<void> {}\n",
        ocr: "export async function submitOcrTask(): Promise<void> {}\nexport function getOcrResult(): void {}\n",
        tools: "export function searchPubMed(): void {}\nexport function executeTool(): void {}\n",
      },
    },
    (cwd) => {
      const scan = scanApiCapabilities(join(cwd, "api/index.ts"));

      assert.deepEqual(
        scan.businessCapabilities.map((capability) => capability.moduleName),
        ["papers", "ocr", "tools"],
      );
      assert.deepEqual(scan.businessCapabilities[0]?.functions, ["searchPapers", "getPapersHealth"]);
      assert.deepEqual(scan.businessCapabilities[2]?.functions, ["searchPubMed", "executeTool"]);
      assert.deepEqual(scan.infrastructureModules.map((moduleInfo) => moduleInfo.moduleName), ["client"]);
      assert.deepEqual(scan.modulesWithoutMetadata, []);
    },
  );
});

test("generated description and api map only include exported business capabilities", () => {
  withFixture(
    {
      modules: {
        papers: "export function searchPapers(): void {}\n",
        upload: "export function requestOpenApiUpload(): void {}\n",
      },
    },
    (cwd) => {
      const scan = scanApiCapabilities(join(cwd, "api/index.ts"));
      const description = buildSkillDescription(scan);
      const apiMap = buildApiMapMarkdown(scan);

      assert.match(description, /论文搜索/);
      assert.doesNotMatch(description, /药物搜索/);
      assert.match(apiMap, /`papers`/);
      assert.match(apiMap, /`searchPapers`/);
      assert.doesNotMatch(apiMap, /`upload`/);
    },
  );
});
