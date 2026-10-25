import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, ".agents", "skills");

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md must start with YAML frontmatter");
  const yaml = match[1];
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const folded = yaml.match(/^description:\s*>\s*\n([\s\S]*)/m);
  const description = folded
    ? folded[1]
        .split("\n")
        .map((line) => line.replace(/^\s{2}/, "").trimEnd())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    : (yaml.match(/^description:\s*(.+)$/m)?.[1] || "").trim();
  return { name, description };
}

describe(".agents/skills frontmatter", () => {
  const names = readdirSync(skillsDir).filter((name) =>
    statSync(join(skillsDir, name)).isDirectory(),
  );

  it("includes the required talk skills plus new-talk", () => {
    for (const required of ["new-talk", "talk-feedback", "slide-images", "inspiring-talks"]) {
      assert.ok(names.includes(required), `missing skill ${required}`);
    }
  });

  for (const name of names) {
    it(`${name}/SKILL.md has name + description that says what and when`, () => {
      const text = readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
      const fm = parseFrontmatter(text);
      assert.equal(fm.name, name);
      assert.ok(fm.description.length > 40, "description too short");
      assert.match(fm.description, /Use when/i);
    });
  }

  it("new-talk scaffolds from templates/talk into apps/site", () => {
    const text = readFileSync(join(skillsDir, "new-talk", "SKILL.md"), "utf8");
    assert.match(text, /templates\/talk/);
    assert.match(text, /apps\/site\/src\/talks/);
  });
});
