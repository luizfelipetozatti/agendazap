const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// App root: one level above this scripts folder
const appRoot = path.resolve(__dirname, "..");

// Candidate sources where Prisma Client may be generated
function listCandidateSources() {
  const candidates = [
    path.resolve(appRoot, "node_modules/.prisma"),
    path.resolve(appRoot, "../database/node_modules/.prisma"),
    path.resolve(appRoot, "../../node_modules/.prisma"),
  ];

  // Scan pnpm virtual store for Prisma client outputs
  const pnpmStores = [
    path.resolve(appRoot, "../../node_modules/.pnpm"),
    path.resolve(appRoot, "../database/node_modules/.pnpm"),
  ];

  for (const store of pnpmStores) {
    if (!fs.existsSync(store)) continue;
    const entries = fs.readdirSync(store, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (
        entry.name.startsWith("@prisma+client@") ||
        entry.name.startsWith("@agendazap+database@")
      ) {
        candidates.push(path.join(store, entry.name, "node_modules/.prisma"));
      }
    }
  }

  return candidates;
}

// Destinations needed for Next.js standalone/server output on Vercel
const destinations = [
  path.resolve(appRoot, ".next/server/.prisma"),
  path.resolve(appRoot, ".next/standalone/node_modules/.prisma"),
];

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`[copy-prisma] source not found, skipping: ${src}`);
    return false;
  }
  try {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`[copy-prisma] copied from ${src} -> ${dest}`);
    return true;
  } catch (err) {
    console.warn(`[copy-prisma] skip copy to ${dest}: ${err.message}`);
    return false;
  }
}

(function main() {
  let copied = 0;

  function attemptCopy() {
    for (const src of listCandidateSources()) {
      for (const dest of destinations) {
        if (copyIfExists(src, dest)) copied += 1;
      }
    }
  }

  attemptCopy();

  if (copied === 0) {
    console.warn("[copy-prisma] No .prisma found, running prisma generate...");
    const root = path.resolve(appRoot, "..", "..");
    const result = spawnSync(
      "pnpm",
      ["--filter", "@agendazap/database", "prisma", "generate", "--schema=./prisma/schema.prisma"],
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
    );

    if (result.status !== 0) {
      console.warn("[copy-prisma] prisma generate failed; proceeding without copy");
    } else {
      attemptCopy();
    }
  }

  if (copied === 0) {
    console.warn(
      "[copy-prisma] No .prisma directory was copied. Ensure Prisma Client is generated before running this script."
    );
    process.exitCode = 1;
  }
})();
