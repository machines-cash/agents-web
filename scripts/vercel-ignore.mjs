import { execFileSync } from "node:child_process";

const PROJECT_NAME = "agents-web";
const PROJECT_PREFIXES = [
  "apps/agents-web/",
  ".github/",
  "public/",
  "scripts/",
  "src/",
];
const PROJECT_FILES = new Set([
  ".env.example",
  ".oss-contrib-allowlist",
  ".oss-export-allowlist",
  "CODEOWNERS",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "tsconfig.base.json",
  "tsconfig.json",
  "vercel.json",
  ".dockerignore",
  "scripts/ensure-lightningcss-wasm.js",
]);

function runGit(repoRoot, args) {
  return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();
}

function getRepoRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
}

function parseChangedFiles(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getChangedFiles(repoRoot, baseSha, headSha) {
  try {
    return parseChangedFiles(runGit(repoRoot, ["diff", "--name-only", baseSha, headSha]));
  } catch {
    return parseChangedFiles(runGit(repoRoot, ["show", "--pretty=format:", "--name-only", headSha]));
  }
}

function isRelevantFile(filePath) {
  if (PROJECT_FILES.has(filePath)) return true;
  return PROJECT_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function main() {
  const baseSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
  const headSha = process.env.VERCEL_GIT_COMMIT_SHA;

  if (!baseSha || !headSha || baseSha === headSha) {
    console.log(`[vercel-ignore:${PROJECT_NAME}] missing commit range; running build.`);
    process.exit(1);
  }

  const repoRoot = getRepoRoot();
  const changedFiles = getChangedFiles(repoRoot, baseSha, headSha);

  if (changedFiles.some(isRelevantFile)) {
    console.log(`[vercel-ignore:${PROJECT_NAME}] relevant changes detected; running build.`);
    process.exit(1);
  }

  console.log(`[vercel-ignore:${PROJECT_NAME}] no relevant changes; skipping build.`);
  process.exit(0);
}

main();
