import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { directionOf, type Locale, THEME_COOKIE, themeAttributes, ThemeScript } from "@orgtik/ui";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import { routing } from "@/i18n/routing";
import { StoreProvider } from "@/store";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "OrgTik Admin", template: "%s · OrgTik Admin" },
  description: "OrgTik's back office: tools, plans, pricing, customers, billing, services and support.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} dir={directionOf(locale as Locale)} {...themeAttributes((await cookies()).get(THEME_COOKIE)?.value)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OrgtikNextProvider locale={locale as Locale}>
            <StoreProvider>{children}</StoreProvider>
          </OrgtikNextProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
