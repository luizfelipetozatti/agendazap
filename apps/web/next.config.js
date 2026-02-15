const isVercel = process.env.VERCEL === "1";
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@agendazap/ui", "@agendazap/database"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/engines", "prisma"],
    // Only include Prisma engines in output tracing on Vercel to avoid Windows FS issues locally
    outputFileTracingIncludes: isVercel
      ? {
          "/api/**/*": [
            "./node_modules/.prisma/client/**",
            "../../packages/database/node_modules/.prisma/client/**",
            "../../node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/prisma@*/node_modules/.prisma/client/**",
          ],
          "/dashboard/**/*": [
            "./node_modules/.prisma/client/**",
            "../../packages/database/node_modules/.prisma/client/**",
            "../../node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/prisma@*/node_modules/.prisma/client/**",
          ],
          "/agendar/**/*": [
            "./node_modules/.prisma/client/**",
            "../../packages/database/node_modules/.prisma/client/**",
            "../../node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**",
            "../../node_modules/.pnpm/prisma@*/node_modules/.prisma/client/**",
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
