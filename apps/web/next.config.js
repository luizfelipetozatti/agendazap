const isVercel = process.env.VERCEL === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@agendazap/ui", "@agendazap/database"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/engines", "prisma"],
    // Only include Prisma engines in output tracing on Vercel to avoid Windows FS issues locally
    outputFileTracingIncludes: isVercel
      ? {
          "/**/*": [
            "./node_modules/.prisma/**", // app-local (when generated in this package)
            "../packages/database/node_modules/.prisma/**", // workspace package location
            "../../node_modules/.prisma/**", // root node_modules (pnpm hoisted)
          ],
        }
      : undefined,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
