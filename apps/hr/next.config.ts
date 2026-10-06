import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';


// Local development: allow next/image to load files served by the local mock API (http://localhost:4004/uploads/...).
const localApi = process.env.NEXT_PUBLIC_API_URL?.startsWith("http://localhost");

const nextConfig: NextConfig = {
  images: {
    domains: ["devbackhr.somion.org"],
    ...(localApi
      ? { remotePatterns: [{ protocol: "http" as const, hostname: "localhost" }], dangerouslyAllowLocalIP: true }
      : { remotePatterns: [{ protocol: "https" as const, hostname: "*.vercel.app" }] }), // hosted prototype mock API
  },
  allowedDevOrigins: ['devdashhr.somion.org'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);