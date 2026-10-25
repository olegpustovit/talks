#!/usr/bin/env node
// Syncs .agents/ and .claude/.
//
// Skills (.agents/skills <-> .claude/skills) are bidirectional. The conflict
// unit is the skill directory. The side with the newer tree mtime wins
// (last write wins). Equal mtimes leave both trees untouched so a second
// run cannot thrash content.
//
// Non-skill .agents content still mirrors one-way into .claude.
//
// Claude Code runtime paths are never touched:
//   - settings.json / settings.local.json — Claude Code's own settings
//   - worktrees/                          — EnterWorktree checkouts
//
// .claude/ stays gitignored. .agents/ is what git tracks. A Claude-side
// skill win is copied back into .agents/skills so it can be committed.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PRESERVE = new Set(["settings.json", "settings.local.json", "worktrees"]);
export const SKILLS_DIR = "skills";

const defaultRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export function skillTreeMtime(dir) {
  if (!existsSync(dir)) return 0;
  let max = 0;
  const walk = (path) => {
    const st = lstatSync(path);
    if (st.isDirectory()) {
      for (const name of readdirSync(path)) {
        walk(join(path, name));
      }
      return;
    }
    if (st.mtimeMs > max) max = st.mtimeMs;
  };
  walk(dir);
  return max;
}

export function listSkillNames(skillsDir) {
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir).filter((name) => {
    const path = join(skillsDir, name);
    return statSync(path).isDirectory();
  });
}

export function copySkillDir(src, dest) {
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true, force: true, preserveTimestamps: true });
}

/**
 * Bidirectional last-write-wins for skill directories.
 * Returns { copied, skipped } describing what happened.
 */
export function syncSkills(agentsSkills, claudeSkills) {
  mkdirSync(agentsSkills, { recursive: true });
  mkdirSync(claudeSkills, { recursive: true });
  const names = new Set([...listSkillNames(agentsSkills), ...listSkillNames(claudeSkills)]);
  const copied = [];
  const skipped = [];
  for (const name of [...names].sort()) {
    const agentsDir = join(agentsSkills, name);
    const claudeDir = join(claudeSkills, name);
    const agentsMtime = skillTreeMtime(agentsDir);
    const claudeMtime = skillTreeMtime(claudeDir);
    if (agentsMtime > claudeMtime) {
      copySkillDir(agentsDir, claudeDir);
      copied.push({ name, direction: "agents-to-claude", agentsMtime, claudeMtime });
    } else if (claudeMtime > agentsMtime) {
      copySkillDir(claudeDir, agentsDir);
      copied.push({ name, direction: "claude-to-agents", agentsMtime, claudeMtime });
    } else {
      skipped.push({ name, agentsMtime, claudeMtime });
    }
  }
  return { copied, skipped };
}

function pruneNonSkill(destDir, srcDir) {
  if (!existsSync(destDir)) return;
  for (const name of readdirSync(destDir)) {
    if (PRESERVE.has(name) || name === SKILLS_DIR) continue;
    const srcPath = join(srcDir, name);
    const destPath = join(destDir, name);
    if (!existsSync(srcPath)) {
      rmSync(destPath, { recursive: true, force: true });
      continue;
    }
    const destStat = lstatSync(destPath);
    const srcStat = lstatSync(srcPath);
    if (destStat.isDirectory() && srcStat.isDirectory()) {
      pruneNonSkill(destPath, srcPath);
    }
  }
}

function copyNonSkillEntry(srcPath, destPath) {
  const srcStat = lstatSync(srcPath);
  if (srcStat.isDirectory()) {
    mkdirSync(destPath, { recursive: true });
    for (const name of readdirSync(srcPath)) {
      copyNonSkillEntry(join(srcPath, name), join(destPath, name));
    }
  } else {
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath, { force: true, preserveTimestamps: true });
  }
}

/**
 * One-way mirror of non-skill .agents content into .claude.
 * Does not touch PRESERVE paths or the skills directory.
 */
export function mirrorNonSkill(agentsDir, claudeDir) {
  mkdirSync(claudeDir, { recursive: true });
  if (!existsSync(agentsDir)) return { mirrored: [] };
  pruneNonSkill(claudeDir, agentsDir);
  const mirrored = [];
  for (const name of readdirSync(agentsDir)) {
    if (name === SKILLS_DIR) continue;
    copyNonSkillEntry(join(agentsDir, name), join(claudeDir, name));
    mirrored.push(name);
  }
  return { mirrored };
}

export function syncClaude(root = defaultRoot) {
  const agentsDir = join(root, ".agents");
  const claudeDir = join(root, ".claude");
  mkdirSync(claudeDir, { recursive: true });
  const nonSkill = mirrorNonSkill(agentsDir, claudeDir);
  const skills = syncSkills(join(agentsDir, SKILLS_DIR), join(claudeDir, SKILLS_DIR));
  return { agentsDir, claudeDir, nonSkill, skills };
}

export function formatSyncReport(result) {
  const lines = [];
  lines.push(`Synced ${result.agentsDir} <-> ${result.claudeDir}`);
  for (const item of result.skills.copied) {
    const arrow = item.direction === "agents-to-claude" ? ".agents -> .claude" : ".claude -> .agents";
    lines.push(`  skill ${item.name}: ${arrow} (newer)`);
  }
  for (const item of result.skills.skipped) {
    lines.push(`  skill ${item.name}: unchanged`);
  }
  if (result.nonSkill.mirrored.length) {
    lines.push(`  non-skill mirrored .agents -> .claude: ${result.nonSkill.mirrored.join(", ")}`);
  } else {
    lines.push("  non-skill mirrored .agents -> .claude");
  }
  lines.push(`  preserved: ${[...PRESERVE].join(", ")}`);
  return lines.join("\n");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = syncClaude();
  console.log(formatSyncReport(result));
}
