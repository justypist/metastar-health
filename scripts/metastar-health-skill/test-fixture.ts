import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface FixtureOptions {
  modules: Record<string, string>;
  skillDescription?: string;
  apiMap?: string;
}

export function withFixture<T>(options: FixtureOptions, run: (cwd: string) => T): T {
  const cwd = mkdtempSync(join(tmpdir(), "metastar-health-skill-"));

  try {
    const skillDir = join(cwd, ".agents/skills/metastar-health");
    mkdirSync(join(cwd, "api"), { recursive: true });
    mkdirSync(join(skillDir, "references"), { recursive: true });
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
      join(skillDir, "SKILL.md"),
      `---\nname: metastar-health\n# BEGIN GENERATED description\n${options.skillDescription ?? "description: stale"}\n# END GENERATED description\n---\n`,
    );
    writeFileSync(
      join(skillDir, "references/api-map.md"),
      `# API 能力表\n\n<!-- BEGIN GENERATED api-map -->\n${options.apiMap ?? "stale"}\n<!-- END GENERATED api-map -->\n`,
    );
    writeFileSync(join(skillDir, "references/overview.md"), "# 总览\n\n只有用户明确授权后才调用真实网络。\n");
    writeFileSync(join(skillDir, "references/sync-search.md"), "# 同步查询 API\n\n示例只能手动调用。\n");
    writeFileSync(join(skillDir, "references/async-doc-processing.md"), "# 文档处理 API\n\n只有用户明确授权后才上传文件。\n");
    writeFileSync(join(skillDir, "references/target-workflows.md"), "# 靶点工作流 API\n\n不得自动创建远端任务。\n");
    return run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}
