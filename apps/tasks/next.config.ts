import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // A production build can sit next to the dev server's output (NEXT_DIST_DIR=.next-prod).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { hostname: "flagicons.lipis.dev" },
      { hostname: "images.unsplash.com" },
      { hostname: "devbacktask.somion.ch" },
      { hostname: "taskback.somion.org" },
      { hostname: "taskback.orgtik.xyz" },
      { hostname: "taskback.orgtik.org" },
      { protocol: "http", hostname: "localhost" }, // local-dev mock API uploads
      { protocol: "https", hostname: "*.vercel.app" }, // hosted prototype mock API uploads
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
