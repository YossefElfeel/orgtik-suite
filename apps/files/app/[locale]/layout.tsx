import type { Metadata } from "next";
import "../globals.css";
import { cookies } from "next/headers";
import { Toaster } from "@orgtik/ui";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { directionOf, type Locale as UiLocale, THEME_COOKIE, themeAttributes, ThemeScript } from "@orgtik/ui";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import { routing } from "@/i18n/routing";
import ReduxProvider from "@/providers/redux-provider";
import { ApiFeedback } from "@/providers/api-feedback";
import { getMessages, getTranslations } from "next-intl/server";

// The tab title in the reader's language ("الملفات · OrgTik"); pages add theirs in front.
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

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // lang, dir and the theme are set here, on the server and before first paint, so an Arabic or
  // dark-theme page never flashes the wrong way round. The fonts come from @orgtik/ui's CSS.
  return (
    <html lang={locale} dir={directionOf(locale as UiLocale)} {...themeAttributes((await cookies()).get(THEME_COOKIE)?.value)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <OrgtikNextProvider locale={locale as UiLocale}>
            <ApiFeedback />
            <ReduxProvider>{children}</ReduxProvider>
          </OrgtikNextProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
