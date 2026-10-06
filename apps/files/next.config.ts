import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
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
