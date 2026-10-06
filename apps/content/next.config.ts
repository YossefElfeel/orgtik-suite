import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Local dev: when NEXT_PUBLIC_API_URL points at a localhost API (the local mock backend), allow next/image
// to load its images (Next 16 blocks optimizing images from private IPs unless dangerouslyAllowLocalIP is set).
const localApi = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(process.env.NEXT_PUBLIC_API_URL ?? "")
  ? new URL(process.env.NEXT_PUBLIC_API_URL as string)
  : null;

const nextConfig = {
  images: {
    ...(localApi ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: [
      ...(localApi ? [{ protocol: "http", hostname: localApi.hostname, port: localApi.port }] : []),
      { protocol: "https", hostname: "*.vercel.app" }, // hosted prototype mock API uploads
      { hostname: "images.unsplash.com" },
      { hostname: "devbackhost.somion.ch" },
      { hostname: "devbackcont.somion.ch" },
      { hostname: "somion-backend.nussuqapp.com" },
      { hostname: "somion.ch" },
      { hostname: "contentback.somion.org" },
      { hostname: "devtestbackcont.somion.ch" },
      { hostname: "contentback.orgtik.xyz" },
      { hostname: "contentback.orgtik.org" },
    ],
  },
};

export default withNextIntl(nextConfig as NextConfig);
