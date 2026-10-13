import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { servicesNextConfig } from "../../tools/services/config.cjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = { ...servicesNextConfig("admin") };

export default withNextIntl(nextConfig);
