const fs = require("fs");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
const monoRoot = path.resolve(appRoot, "../..");

/**
 * Find the .prisma/client directory containing the engine binary.
 * Searches through common pnpm monorepo locations.
 */
function findPrismaClientDir() {
  const candidates = [
    path.resolve(monoRoot, "node_modules/.prisma/client"),
    path.resolve(appRoot, "node_modules/.prisma/client"),
    path.resolve(monoRoot, "packages/database/node_modules/.prisma/client"),
  ];

  // Check pnpm virtual store
  const pnpmStore = path.resolve(monoRoot, "node_modules/.pnpm");
  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith("@prisma+client@")) {
        candidates.push(
          path.join(pnpmStore, entry.name, "node_modules/.prisma/client")
        );
      }
    }
  }

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      const hasEngine = fs
        .readdirSync(dir)
        .some((f) => f.includes("libquery_engine") || f.endsWith(".so.node"));
      if (hasEngine) {
        console.log(`[copy-prisma] Found engine at: ${dir}`);
        return dir;
      }
    }
  }

  return null;
}

function main() {
  console.log("[copy-prisma] Copying Prisma engine to standalone output...");

  const prismaDir = findPrismaClientDir();
  if (!prismaDir) {
    console.warn("[copy-prisma] No Prisma engine found — skipping (may work via tracing).");
    return;
  }

  // Only copy to the standalone output locations where Vercel looks for it
  const destinations = [
    path.resolve(appRoot, ".next/standalone/node_modules/.prisma/client"),
    path.resolve(
      appRoot,
      ".next/standalone/apps/web/node_modules/.prisma/client"
    ),
  ];

  for (const dest of destinations) {
    try {
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(prismaDir, dest, { recursive: true, force: true });
      console.log(`[copy-prisma] Copied to ${dest}`);
    } catch (err) {
      console.warn(`[copy-prisma] Failed: ${dest} — ${err.message}`);
    }
  }

  console.log("[copy-prisma] Done.");
}

main();
