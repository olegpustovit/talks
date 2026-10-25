import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PRESERVE, syncClaude } from "./sync-claude.mjs";

const fixtures = [];

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), "sync-claude-"));
  fixtures.push(root);
  mkdirSync(join(root, ".agents", "skills"), { recursive: true });
  mkdirSync(join(root, ".claude"), { recursive: true });
  return root;
}

function writeSkill(root, side, name, body, mtimeSec) {
  const dir = join(root, side, "skills", name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "SKILL.md");
  writeFileSync(file, body);
  if (mtimeSec != null) {
    utimesSync(file, mtimeSec, mtimeSec);
    utimesSync(dir, mtimeSec, mtimeSec);
  }
  return file;
}

function readSkill(root, side, name) {
  return readFileSync(join(root, side, "skills", name, "SKILL.md"), "utf8");
}

afterEach(() => {
  while (fixtures.length) {
    const dir = fixtures.pop();
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("syncClaude last-write-wins skills", () => {
  it("newer .agents skill overwrites .claude", () => {
    const root = makeRoot();
    const older = 1_700_000_000;
    const newer = 1_800_000_000;
    writeSkill(root, ".claude", "talk-feedback", "claude-old\n", older);
    writeSkill(root, ".agents", "talk-feedback", "agents-new\n", newer);

    const result = syncClaude(root);

    assert.equal(readSkill(root, ".claude", "talk-feedback"), "agents-new\n");
    assert.equal(readSkill(root, ".agents", "talk-feedback"), "agents-new\n");
    assert.equal(result.skills.copied.length, 1);
    assert.equal(result.skills.copied[0].direction, "agents-to-claude");
  });

  it("newer .claude skill overwrites .agents", () => {
    const root = makeRoot();
    const older = 1_700_000_000;
    const newer = 1_800_000_000;
    writeSkill(root, ".agents", "slide-images", "agents-old\n", older);
    writeSkill(root, ".claude", "slide-images", "claude-new\n", newer);

    const result = syncClaude(root);

    assert.equal(readSkill(root, ".agents", "slide-images"), "claude-new\n");
    assert.equal(readSkill(root, ".claude", "slide-images"), "claude-new\n");
    assert.equal(result.skills.copied.length, 1);
    assert.equal(result.skills.copied[0].direction, "claude-to-agents");
  });

  it("equal mtimes do not thrash content", () => {
    const root = makeRoot();
    const same = 1_750_000_000;
    writeSkill(root, ".agents", "inspiring-talks", "agents-copy\n", same);
    writeSkill(root, ".claude", "inspiring-talks", "claude-copy\n", same);

    const result = syncClaude(root);

    assert.equal(readSkill(root, ".agents", "inspiring-talks"), "agents-copy\n");
    assert.equal(readSkill(root, ".claude", "inspiring-talks"), "claude-copy\n");
    assert.equal(result.skills.copied.length, 0);
    assert.equal(result.skills.skipped.length, 1);
    assert.equal(result.skills.skipped[0].name, "inspiring-talks");
  });

  it("preserves Claude runtime settings.json and worktrees", () => {
    const root = makeRoot();
    writeSkill(root, ".agents", "new-talk", "scaffold\n", 1_800_000_000);
    const settings = join(root, ".claude", "settings.json");
    writeFileSync(settings, '{"keep":true}\n');
    const worktreeFile = join(root, ".claude", "worktrees", "slide-engine", "note.txt");
    mkdirSync(join(root, ".claude", "worktrees", "slide-engine"), { recursive: true });
    writeFileSync(worktreeFile, "isolated checkout\n");
    const localSettings = join(root, ".claude", "settings.local.json");
    writeFileSync(localSettings, '{"local":true}\n');

    syncClaude(root);

    assert.equal(readFileSync(settings, "utf8"), '{"keep":true}\n');
    assert.equal(readFileSync(worktreeFile, "utf8"), "isolated checkout\n");
    assert.equal(readFileSync(localSettings, "utf8"), '{"local":true}\n');
    for (const name of PRESERVE) {
      assert.ok(existsSync(join(root, ".claude", name)), `expected ${name} to remain`);
    }
  });

  it("a second run after an agents-newer copy does not reverse the winner", () => {
    const root = makeRoot();
    writeSkill(root, ".claude", "talk-feedback", "claude-old\n", 1_700_000_000);
    writeSkill(root, ".agents", "talk-feedback", "agents-new\n", 1_800_000_000);

    const first = syncClaude(root);
    const second = syncClaude(root);

    assert.equal(first.skills.copied[0].direction, "agents-to-claude");
    assert.equal(readSkill(root, ".claude", "talk-feedback"), "agents-new\n");
    assert.equal(readSkill(root, ".agents", "talk-feedback"), "agents-new\n");
    assert.equal(second.skills.copied.length, 0);
    assert.equal(second.skills.skipped[0].name, "talk-feedback");
  });

  it("mirrors non-skill .agents files into .claude and copies a skill that exists on only one side", () => {
    const root = makeRoot();
    writeFileSync(join(root, ".agents", "README.md"), "agents readme\n");
    writeSkill(root, ".agents", "only-agents", "from-agents\n", 1_800_000_000);
    writeSkill(root, ".claude", "only-claude", "from-claude\n", 1_800_000_000);

    syncClaude(root);

    assert.equal(readFileSync(join(root, ".claude", "README.md"), "utf8"), "agents readme\n");
    assert.equal(readSkill(root, ".claude", "only-agents"), "from-agents\n");
    assert.equal(readSkill(root, ".agents", "only-claude"), "from-claude\n");
    assert.ok(!existsSync(join(root, ".agents", "settings.json")));
  });
});
