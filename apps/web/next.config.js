const isVercel = process.env.VERCEL === "1";
const path = require("path");

// Prisma client paths for output file tracing
const prismaClientPaths = [
  "./node_modules/.prisma/client/**",
  "./node_modules/@prisma/client/**",
  "../../packages/database/node_modules/.prisma/client/**",
  "../../packages/database/node_modules/@prisma/client/**",
  "../../node_modules/.prisma/client/**",
  "../../node_modules/@prisma/client/**",
  "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**",
  "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@agendazap/ui", "@agendazap/database"],
  // Mark Prisma as external for serverless
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    // Include Prisma engines in output tracing for Vercel deployment
    outputFileTracingIncludes: isVercel
      ? {
          "/**/*": prismaClientPaths,
        }
      : undefined,
  },
  // Webpack configuration for Prisma in serverless
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins];
    }
    return config;
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
