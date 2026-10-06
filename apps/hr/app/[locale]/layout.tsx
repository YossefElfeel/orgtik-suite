import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { THEME_COOKIE, ThemeScript, directionOf, themeAttributes, type Locale as UiLocale } from "@orgtik/ui";
import { cookies } from "next/headers";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import Loading from "./loading";
import { routing } from "@/i18n/routing";
import ReduxProvider from "@/providers/redux-provider";
import { ApiFeedback } from "@/providers/api-feedback";

// The tab title in the reader's language ("HR · OrgTik"); pages add theirs in front.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "suite" });
  const name = `${t("appName")} · OrgTik`;
  return { title: { default: name, template: `%s · ${name}` } };
}

// lang, dir and the theme are set here, on the server and before first paint (HR wave, FS-HR-2), so
// an Arabic or dark-theme page never flashes the wrong way round. Fonts come from @orgtik/ui's CSS.
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // The theme comes from the suite's ot-theme cookie, on the server (FS-HR-10: no raw colours left, so
  // dark is on). ThemeScript follows the system setting before first paint; setting it here too keeps
  // a 404, whose <html> is replaced on the client, in the right theme.
  const theme = themeAttributes((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang={locale} dir={directionOf(locale as UiLocale)} {...theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <Suspense fallback={<Loading />}>
          <NextIntlClientProvider>
            <OrgtikNextProvider locale={locale as UiLocale}>
              <ApiFeedback />
              <ReduxProvider>
                {children}
                <Toaster />
              </ReduxProvider>
            </OrgtikNextProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
