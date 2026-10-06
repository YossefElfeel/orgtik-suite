import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// No next/image any more (media come from the API as plain <img>), so the deprecated
// images.domains list is gone.
const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
