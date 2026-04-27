import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { generateSkillFiles } from "./generate.ts";
import { withFixture } from "./test-fixture.ts";

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
