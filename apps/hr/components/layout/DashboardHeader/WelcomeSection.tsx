"use client";

// The top bar's greeting (FS-HR-4): in the reader's language, a paragraph (not a heading above
// every page's own title), and Phosphor icons (D-008).
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CloudSun, MoonStars, Sun, SunHorizon } from "@phosphor-icons/react";
import { useAppSelector } from "@/redux/app/hooks";

type Part = "morning" | "afternoon" | "evening" | "night";

const ICON: Record<Part, ReactNode> = {
  morning: <Sun weight="fill" className="text-warning" />,
  afternoon: <CloudSun weight="fill" className="text-warning" />,
  evening: <SunHorizon weight="fill" className="text-warning" />,
  night: <MoonStars weight="fill" className="text-info" />,
};

function partOfDay(now: Date): Part {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export default function WelcomeSection() {
  const t = useTranslations("suite.greeting");
  const firstName = useAppSelector((state) => state.auth.user?.firstName) ?? "";
  // The hour is the browser's: it waits for the client, so the server HTML and the first render match.
  const [part, setPart] = useState<Part | null>(null);

  useEffect(() => {
    setPart(partOfDay(new Date()));
    const id = window.setInterval(() => setPart(partOfDay(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!part) {
    return (
      <div className="flex min-w-0 max-w-[min(100%,22rem)] items-center gap-2 overflow-hidden sm:max-w-none">
        <div className="size-[22px] shrink-0 rounded bg-secondary/10" aria-hidden />
        <div className="h-5 w-44 max-w-full rounded bg-secondary/10 sm:h-[22px]" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-[min(100%,22rem)] items-center gap-2 overflow-hidden sm:max-w-none">
      <span aria-hidden="true" className="shrink-0 text-[22px] leading-none">
        {ICON[part]}
      </span>
      <p className="truncate text-lg font-medium text-secondary">{t(part, { name: firstName })}</p>
    </div>
  );
}
