import type { Metadata } from "next";
import React from "react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@orgtik/ui";
import { LanguageSelect } from "@/components/auth/LanguageSelect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("title") };
}

// The suite's apps, as the launcher names them: facts, not claims.
const APPS = ["files", "tasks", "hr", "crm", "marketing", "chats", "website"] as const;

// VS-1: sign-in on @orgtik/ui. On wide screens the reading-start side is the brand: the dark
// chrome with the gradient mark and the suite's apps; the form stays quiet on the other side.
async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("AuthShell");
  return (
    <div className="grid min-h-dvh bg-canvas text-fg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside data-theme="dark" className="relative hidden flex-col justify-between overflow-hidden bg-chrome p-12 text-fg-on-chrome lg:flex">
        <Logo variant="wordmark" className="h-8 self-start text-fg-on-chrome" />
        <div className="flex flex-col gap-8">
          <Logo variant="mark" tone="brand" label="" className="h-20 self-start" />
          <p className="max-w-sm font-display text-title-lg text-fg-on-chrome">{t("tagline")}</p>
          <ul className="flex max-w-sm flex-wrap gap-2" aria-label={t("appsLabel")}>
            {APPS.map((app) => (
              <li key={app} className="rounded-pill border border-line-strong px-3 py-1 text-body-sm text-fg-on-chrome-muted">
                {t(`apps.${app}`)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-caption text-fg-on-chrome-muted">
          <span dir="ltr">© OrgTik</span>
        </p>
      </aside>
      <main className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 p-6 lg:justify-end">
          <Logo variant="wordmark" className="h-7 text-fg lg:hidden" />
          <LanguageSelect />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-16">{children}</div>
      </main>
    </div>
  );
}

export default AuthLayout;
