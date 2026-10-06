import "../globals.css";
import { ThemeScript, directionOf } from "@orgtik/ui";
import { OrgtikNextProvider } from "@orgtik/ui/next";

export default async function Layout({ children, params }) {
  const { locale } = await params;
  return (
    <html lang={locale} dir={directionOf(locale)} data-theme="light" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><OrgtikNextProvider locale={locale}>{children}</OrgtikNextProvider></body>
    </html>
  );
}
