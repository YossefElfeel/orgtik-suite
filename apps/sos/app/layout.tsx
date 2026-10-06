import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/providers/redux-provider";
import { Suspense } from "react";
import Loading from "./loading";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { directionOf, type Locale, THEME_COOKIE, themeAttributes, ThemeScript, Toaster } from "@orgtik/ui";
import { ApiFeedback } from "@/providers/api-feedback";
import { OrgtikNextProvider } from "@orgtik/ui/next";

// Every tab says where you are in the reader's language: "People · OrgTik".
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Suite");
  return { title: { default: t("appName"), template: `%s · ${t("appName")}` } };
}

// VS-1: the language comes from the person's choice or their browser (i18n/request.ts), and lang,
// dir and the theme are set here on the server, before first paint. Fonts come from @orgtik/ui.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  return (
    <html lang={locale} dir={directionOf(locale)} {...themeAttributes((await cookies()).get(THEME_COOKIE)?.value)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OrgtikNextProvider locale={locale}>
            <Suspense fallback={<Loading />}>
              <ApiFeedback />
              <ReduxProvider>
                {children}
                <Toaster />
              </ReduxProvider>
            </Suspense>
          </OrgtikNextProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
