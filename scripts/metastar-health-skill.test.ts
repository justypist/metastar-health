import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import {
  buildApiMapMarkdown,
  buildSkillDescription,
  generateSkillFiles,
  parseApiIndexExports,
  scanApiCapabilities,
} from "./metastar-health-skill.ts";

interface FixtureOptions {
  modules: Record<string, string>;
  skillDescription?: string;
  apiMap?: string;
}

function withFixture<T>(options: FixtureOptions, run: (cwd: string) => T): T {
  const cwd = mkdtempSync(join(tmpdir(), "metastar-health-skill-"));

  try {
    mkdirSync(join(cwd, "api"), { recursive: true });
    mkdirSync(join(cwd, ".agents/skills/metastar-health/references"), { recursive: true });
    writeFileSync(
      join(cwd, "api/index.ts"),
      Object.keys(options.modules)
        .map((moduleName) => `export * from "./${moduleName}.ts";`)
        .join("\n"),
    );

    for (const [moduleName, source] of Object.entries(options.modules)) {
      writeFileSync(join(cwd, `api/${moduleName}.ts`), source);
    }

    writeFileSync(
      join(cwd, ".agents/skills/metastar-health/SKILL.md"),
      `---\nname: metastar-health\n# BEGIN GENERATED description\n${options.skillDescription ?? "description: stale"}\n# END GENERATED description\n---\n`,
    );
    writeFileSync(
      join(cwd, ".agents/skills/metastar-health/references/api-map.md"),
      `# API 能力表\n\n<!-- BEGIN GENERATED api-map -->\n${options.apiMap ?? "stale"}\n<!-- END GENERATED api-map -->\n`,
    );

    return run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("parseApiIndexExports reads public module exports", () => {
  assert.deepEqual(parseApiIndexExports('export * from "./papers.ts";\nexport * from "./client.ts";'), [
    { moduleName: "papers", exportPath: "./papers.ts" },
    { moduleName: "client", exportPath: "./client.ts" },
  ]);
});

test("scanApiCapabilities identifies business modules and exported functions", () => {
  withFixture(
    {
      modules: {
        client: "export function requestOpenApi(): void {}\n",
        papers: "export function searchPapers(): void {}\nexport async function getPapersHealth(): Promise<void> {}\n",
        ocr: "export async function submitOcrTask(): Promise<void> {}\nexport function getOcrResult(): void {}\n",
      },
    },
    (cwd) => {
      const scan = scanApiCapabilities(join(cwd, "api/index.ts"));

      assert.deepEqual(
        scan.businessCapabilities.map((capability) => capability.moduleName),
        ["papers", "ocr"],
      );
      assert.deepEqual(scan.businessCapabilities[0]?.functions, ["searchPapers", "getPapersHealth"]);
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

test("generateSkillFiles check mode fails when generated regions are stale", () => {
  withFixture(
    {
      modules: {
        papers: "export function searchPapers(): void {}\n",
      },
    },
    (cwd) => {
      assert.throws(() => generateSkillFiles({ check: true, cwd }), /metadata is out of date/);

      const result = generateSkillFiles({ cwd });
      assert.equal(result.checked, false);
      assert.equal(result.changedFiles.length, 2);
      assert.doesNotThrow(() => generateSkillFiles({ check: true, cwd }));
      assert.match(readFileSync(join(cwd, ".agents/skills/metastar-health/SKILL.md"), "utf8"), /论文搜索/);
    },
  );
});
