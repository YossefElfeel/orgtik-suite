import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { servicesNextConfig } from "../../tools/services/config.cjs";

const withNextIntl = createNextIntlPlugin();

// No next/image any more (media come from the API as plain <img>), so the deprecated
// images.domains list is gone.
const nextConfig: NextConfig = { ...servicesNextConfig("marketing") };

export default withNextIntl(nextConfig);
