import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, ThemeScript, Toaster, directionOf, themeAttributes, type Locale as UiLocale } from "@orgtik/ui";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import { Toaster as LegacyToaster } from "@/components/ui/sonner";
import ApiLocaleSync from "@/providers/ApiLocaleSync";
import ReduxProvider from "@/providers/redux-provider";
import { ApiFeedback } from "@/providers/api-feedback";
import { readSession } from "@/lib/session";

// The tab title in the reader's language ("المبيعات · OrgTik"); pages add theirs in front. Every
// tab was titled "Create Next App".
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suite" });
  const name = `${t("appName")} · OrgTik`;
  return { title: { default: name, template: `%s · ${name}` } };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // lang, dir and the theme are set on the server (and by ThemeScript before first paint), so an
  // Arabic or dark page never flashes the wrong way round. Sales had no dark mode at all. The fonts
  // come from @orgtik/ui's CSS, Arabic included. The session comes from the cookies here too, so
  // the server and the browser render the same person.
  const session = await readSession();
  const theme = themeAttributes((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} dir={directionOf(locale as UiLocale)} {...theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full antialiased">
        <NextIntlClientProvider>
          <OrgtikNextProvider locale={locale as UiLocale}>
            <ApiFeedback />
            <ReduxProvider auth={session}>
              <ApiLocaleSync />
              {children}
            </ReduxProvider>
          </OrgtikNextProvider>
        </NextIntlClientProvider>
        <Toaster />
        {/* Screens not yet moved to the library (and the frozen SaaS-admin routes) still call sonner. */}
        <LegacyToaster richColors />
      </body>
    </html>
  );
}
