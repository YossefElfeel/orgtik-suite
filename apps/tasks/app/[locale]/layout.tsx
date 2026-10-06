import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/providers/redux-provider";
import { ApiFeedback } from "@/providers/api-feedback";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Realtime } from "@/components/suite/Realtime";
import { THEME_COOKIE, ThemeScript, Toaster, directionOf, themeAttributes, type Locale as UiLocale } from "@orgtik/ui";
import { cookies } from "next/headers";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import { readSession } from "@/lib/session";

// The tab title in the reader's language ("المهام · OrgTik"); pages add theirs in front.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suite" });
  const name = `${t("appName")} · OrgTik`;
  return { title: { default: name, template: `%s · ${name}` } };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // lang, dir and the theme are set here, on the server and before first paint, so an Arabic or
  // dark page never flashes the wrong way round. The fonts come from @orgtik/ui's CSS. The session
  // comes from the cookies here too, so the server and the browser render the same person.
  const session = await readSession();
  // Also set on the server: a 404 renders as an error shell and its <html> is replaced on the
  // client, which dropped the attribute ThemeScript had set (a dark-theme reader got a light 404).
  const theme = themeAttributes((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} dir={directionOf(locale as UiLocale)} {...theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider>
          <OrgtikNextProvider locale={locale as UiLocale}>
            <ApiFeedback />
            <ReduxProvider auth={session}>
              {children}
              <Realtime />
            </ReduxProvider>
          </OrgtikNextProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
