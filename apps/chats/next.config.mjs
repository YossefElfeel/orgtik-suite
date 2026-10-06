/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@excalidraw/excalidraw'],
  experimental: {
    /* The icon set is one barrel of some three thousand modules. Without this,
       every page that imports one icon compiles the whole barrel in
       development and ships far more of it than it uses. */
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
