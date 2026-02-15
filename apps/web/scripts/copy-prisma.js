const fs = require("fs");
const path = require("path");

// App root: one level above this scripts folder
const appRoot = path.resolve(__dirname, "..");
const monoRoot = path.resolve(appRoot, "../..");

// Find .prisma/client directory in pnpm structure
function findPrismaClientDir() {
  const candidates = [
    // Direct in packages/database
    path.resolve(monoRoot, "packages/database/node_modules/.prisma/client"),
    // Hoisted to root
    path.resolve(monoRoot, "node_modules/.prisma/client"),
    // App local
    path.resolve(appRoot, "node_modules/.prisma/client"),
  ];

  // Also check pnpm virtual store
  const pnpmStore = path.resolve(monoRoot, "node_modules/.pnpm");
  if (fs.existsSync(pnpmStore)) {
    const entries = fs.readdirSync(pnpmStore, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("@prisma+client@")) {
        candidates.push(path.join(pnpmStore, entry.name, "node_modules/.prisma/client"));
      }
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const files = fs.readdirSync(candidate);
      const hasEngine = files.some(f => f.startsWith("libquery_engine") || f.endsWith(".so.node"));
      if (hasEngine) {
        console.log(`[copy-prisma] Found Prisma client with engine at: ${candidate}`);
        return candidate;
      }
    }
  }

  return null;
}

// Get all engine files from source directory
function getEngineFiles(sourceDir) {
  if (!fs.existsSync(sourceDir)) return [];
  return fs.readdirSync(sourceDir).filter(file => 
    file.startsWith("libquery_engine") || 
    file.endsWith(".so.node") ||
    file === "schema.prisma"
  );
}

function copyEngineFiles(sourceDir, destDir) {
  const engineFiles = getEngineFiles(sourceDir);
  
  if (engineFiles.length === 0) {
    console.warn(`[copy-prisma] No engine files found in ${sourceDir}`);
    return false;
  }

  fs.mkdirSync(destDir, { recursive: true });

  for (const file of engineFiles) {
    const src = path.join(sourceDir, file);
    const dest = path.join(destDir, file);
    fs.copyFileSync(src, dest);
    console.log(`[copy-prisma] Copied ${file} to ${destDir}`);
  }

  return true;
}

function main() {
  console.log("[copy-prisma] Starting Prisma engine copy...");
  
  const prismaClientDir = findPrismaClientDir();
  
  if (!prismaClientDir) {
    console.error("[copy-prisma] Could not find Prisma client directory with engine files.");
    console.log("[copy-prisma] Searched in:");
    console.log(`  - ${path.resolve(monoRoot, "packages/database/node_modules/.prisma/client")}`);
    console.log(`  - ${path.resolve(monoRoot, "node_modules/.prisma/client")}`);
    console.log(`  - ${path.resolve(appRoot, "node_modules/.prisma/client")}`);
    process.exit(1);
  }

  // Destinations where Next.js looks for the engine
  const destinations = [
    path.resolve(appRoot, ".next/server"),
    path.resolve(appRoot, ".next/standalone/apps/web/.next/server"),
    path.resolve(appRoot, ".next/standalone/node_modules/.prisma/client"),
  ];

  let success = false;
  for (const dest of destinations) {
    try {
      if (copyEngineFiles(prismaClientDir, dest)) {
        success = true;
      }
    } catch (err) {
      console.warn(`[copy-prisma] Failed to copy to ${dest}: ${err.message}`);
    }
  }

  // Also copy the entire .prisma/client directory structure
  const prismaDestinations = [
    path.resolve(appRoot, ".next/server/.prisma/client"),
    path.resolve(appRoot, ".next/standalone/node_modules/.prisma/client"),
  ];

  for (const dest of prismaDestinations) {
    try {
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(prismaClientDir, dest, { recursive: true, force: true });
      console.log(`[copy-prisma] Copied full .prisma/client to ${dest}`);
      success = true;
    } catch (err) {
      console.warn(`[copy-prisma] Failed to copy .prisma/client to ${dest}: ${err.message}`);
    }
  }

  if (!success) {
    console.error("[copy-prisma] Failed to copy any engine files.");
    process.exit(1);
  }

  console.log("[copy-prisma] Engine copy completed successfully.");
}

main();
