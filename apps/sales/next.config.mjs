import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const nextIntlConfigPath = path.resolve(projectRoot, "i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next-intl/config": nextIntlConfigPath,
    };
    return config;
  },
  images: {
    domains: ["salesback.orgtik.xyz", "salesback.orgtik.org"],
    remotePatterns: [{ protocol: "https", hostname: "*.vercel.app" }, // hosted prototype mock API uploads],
  },
};

export default nextConfig;
