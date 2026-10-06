import "./globals.css";
import { ThemeScript } from "@orgtik/ui";
import { ButtonAnchor } from "@/components/shared/ButtonLink";

// The last-resort 404, for an address outside every language (the proxy normally adds one, so a
// reader rarely sees this). It can't know the reader's language, so it stays short and points to
// the start, which picks it. Each language's own 404 is app/[locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <main className="grid min-h-dvh place-items-center bg-canvas p-4 text-center">
          <div className="flex max-w-md flex-col items-center gap-3">
            <p className="text-eyebrow text-fg-brand">404</p>
            <h1 className="font-display text-title text-fg">Page not found</h1>
            <p className="text-body text-fg-muted">This address doesn&apos;t lead to a page in Files.</p>
            <ButtonAnchor href="/">
              Go to Files
            </ButtonAnchor>
          </div>
        </main>
      </body>
    </html>
  );
}

export const metadata = {
  title: "Page not found · Files",
  robots: { index: false },
};
