import type React from "react";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { Locale, routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import ReduxProvider from "@/providers/redux-provider";
import { notFound } from "next/navigation";
import "./globals.css";
import SomionGalleryWrapper from "@/components/contexts/SomionGalleryWrapper";

const rubik = Rubik({ subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "Somion | Dashboard",
  description: "Somion dashboard",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${rubik.className} antialiased flex overflow-x-hidden min-h-screen`}
      >
        <NextIntlClientProvider messages={messages}>
          <ReduxProvider>
            <SomionGalleryWrapper>
              {children}
              <Toaster />
            </SomionGalleryWrapper>
          </ReduxProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
