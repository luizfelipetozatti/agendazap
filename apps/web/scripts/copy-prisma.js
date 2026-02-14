const fs = require("fs");
const path = require("path");

// App root: one level above this scripts folder
const appRoot = path.resolve(__dirname, "..");

// Candidate sources where Prisma Client may be generated
const sources = [
  path.resolve(appRoot, "node_modules/.prisma"),
  path.resolve(appRoot, "../database/node_modules/.prisma"),
  path.resolve(appRoot, "../../node_modules/.prisma"),
];

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
  for (const src of sources) {
    for (const dest of destinations) {
      if (copyIfExists(src, dest)) copied += 1;
    }
  }

  if (copied === 0) {
    console.warn(
      "[copy-prisma] No .prisma directory was copied. Ensure Prisma Client is generated before running this script."
    );
    process.exitCode = 1;
  }
})();
