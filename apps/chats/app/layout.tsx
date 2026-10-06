import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { directionOf, THEME_COOKIE, themeAttributes, ThemeScript } from "@orgtik/ui";
import { OrgtikNextProvider } from "@orgtik/ui/next";
import { ACCENT_BOOT_SCRIPT } from "@/lib/appearance";
import { I18nProvider } from "@/lib/i18n";
import { formatMessage } from "@/lib/messages";
import { readLocale, readMessages } from "@/lib/server-i18n";

/* Every tab says where you are, in the reader's language: "#design · Chats". */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const m = await readMessages(locale);
  const name = formatMessage(m["app.name"] ?? "Chats", undefined, locale);
  return {
    title: { default: `${name} · OrgTik`, template: `%s · ${name}` },
    description: m["app.description"] ?? "Team chat, calls and a virtual office, with every conversation attached to the work it belongs to.",
    applicationName: name,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  /* The browser paints the address bar with this: the canvas of each theme. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0814" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* lang, dir and the theme are set on the server, before first paint (Chats wave, FS-CHT-1). Fonts
   come from @orgtik/ui. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await readLocale();
  const messages = await readMessages(locale);
  return (
    /* suppressHydrationWarning: the theme and accent scripts set data-theme and data-accent on this
       element before React arrives, and that is intended. */
    <html lang={locale} dir={directionOf(locale)} {...themeAttributes((await cookies()).get(THEME_COOKIE)?.value)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }} />
        <OrgtikNextProvider locale={locale}>
          <I18nProvider locale={locale} messages={messages}>
            {children}
          </I18nProvider>
        </OrgtikNextProvider>
      </body>
    </html>
  );
}
