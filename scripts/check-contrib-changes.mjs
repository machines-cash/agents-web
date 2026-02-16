import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const allowlistPath = path.join(repoRoot, ".oss-contrib-allowlist");

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function parseAllowlist(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const rules = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.endsWith("/**")) {
      rules.push({ type: "dir", value: trimmed.slice(0, -3).replace(/\/$/, "") });
      continue;
    }

    if (trimmed.endsWith("/")) {
      rules.push({ type: "dir", value: trimmed.replace(/\/$/, "") });
      continue;
    }

    rules.push({ type: "file", value: trimmed });
  }

  return rules;
}

function isAllowed(relativePath, rules) {
  const normalized = relativePath.replace(/\\/g, "/");
  for (const rule of rules) {
    if (rule.type === "file") {
      if (normalized === rule.value) return true;
      continue;
    }
    if (normalized === rule.value || normalized.startsWith(`${rule.value}/`)) {
      return true;
    }
  }
  return false;
}

function normalizeChangedPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("apps/agents-web/")) {
    return normalized.slice("apps/agents-web/".length);
  }
  return normalized;
}

function resolveRange() {
  const baseRef = process.env.GITHUB_BASE_REF?.trim();
  if (baseRef) {
    return `origin/${baseRef}...HEAD`;
  }

  let before = process.env.GITHUB_EVENT_BEFORE?.trim();
  if (!before && process.env.GITHUB_EVENT_PATH) {
    try {
      const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
      if (typeof payload?.before === "string") {
        before = payload.before.trim();
      }
    } catch {
      // Ignore malformed event payload and use default fallback below.
    }
  }

  if (before && before !== "0000000000000000000000000000000000000000") {
    return `${before}...HEAD`;
  }

  return "HEAD~1...HEAD";
}

if (!fs.existsSync(allowlistPath)) {
  throw new Error(`missing allowlist file: ${allowlistPath}`);
}

const rules = parseAllowlist(allowlistPath);
const range = resolveRange();
let changed = [];
try {
  changed = runGit(["diff", "--name-only", range])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
} catch {
  changed = runGit(["show", "--pretty=format:", "--name-only", "HEAD"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const disallowed = changed.filter((filePath) => !isAllowed(normalizeChangedPath(filePath), rules));

if (disallowed.length > 0) {
  console.error("found disallowed changed files for external contribution intake:");
  for (const filePath of disallowed) {
    console.error(`- ${filePath}`);
  }
  process.exit(1);
}

console.log(`contributor changed-files policy passed (${changed.length} files checked).`);
