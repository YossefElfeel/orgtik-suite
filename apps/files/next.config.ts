import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { servicesNextConfig } from "../../tools/services/config.cjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  ...servicesNextConfig("files"),
  // The registered local Files handoff uses this loopback alias in development.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.vercel.app" }, // hosted prototype mock API uploads
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "devbacktask.somion.ch",
      },
      {
        protocol: "https",
        hostname: "devback-filemanger.somion.org",
      },
      {
        protocol: "https",
        hostname: "file-managerback.somion.org",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
