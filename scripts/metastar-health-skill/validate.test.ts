import assert from "node:assert/strict";
import { test } from "node:test";

import { requiredSkillFiles } from "./paths.ts";
import { validateSkillStructure } from "./validate.ts";
import { withFixture } from "./test-fixture.ts";

test("validateSkillStructure checks required files and safety constraints", () => {
  withFixture(
    {
      modules: {
        papers: "export function searchPapers(): void {}\n",
      },
      skillDescription:
        'description: "使用 MetaStar Health 开放 API 进行研究任务，按需调用论文搜索能力。"\n不得自动访问真实网络\nreferences/api-map.md',
    },
    (cwd) => {
      const result = validateSkillStructure({ cwd });

      assert.equal(result.checkedFiles.length, requiredSkillFiles.length);
    },
  );
});

test("validateSkillStructure rejects likely real credentials", () => {
  withFixture(
    {
      modules: {
        papers: "export function searchPapers(): void {}\n",
      },
      skillDescription:
        'description: "使用 MetaStar Health 开放 API 进行研究任务，按需调用论文搜索能力。"\n不得自动访问真实网络\nreferences/api-map.md\nappSecret: "real-secret-value"',
    },
    (cwd) => {
      assert.throws(() => validateSkillStructure({ cwd }), /Potential real credential/);
    },
  );
});
