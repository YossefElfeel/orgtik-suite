"use client";

// What the team did, grouped by day, with the period and page in the address.
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { ListStates, Pagination, Select, useFormatter } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import TaskActivityCard from "@/components/shared/TaskActivityCard";
import { useTeamId } from "@/components/pages/team/TeamFrame";
import { useGetTeamTaskActivityQuery } from "@/redux/features/teams/teamsApi";
import type { ITaskActivity } from "@/types";

const PERIODS = ["all", "1d", "7d", "1m", "1y"] as const;
type Period = (typeof PERIODS)[number];

export default function TeamFeedPage() {
  const t = useTranslations("TeamPage");
  const f = useFormatter();
  const id = useTeamId() ?? 0;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const period = (PERIODS.includes(params.get("period") as Period) ? params.get("period") : "all") as Period;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const go = (next: { period?: Period; page?: number }) => {
    const sp = new URLSearchParams();
    const p = next.period ?? period;
    if (p !== "all") sp.set("period", p);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  const { data, isLoading, isError, refetch } = useGetTeamTaskActivityQuery({ id, page, duration: period });
  const groups = Object.entries(data?.data?.tasks ?? {}).filter(([, list]) => Array.isArray(list) && list.length);
  const meta = data?.data?.meta;
  // The API groups by "YYYY-MM-DD"; show the day in the reader's language.
  const dayLabel = (key: string) => (/^\d{4}-\d{2}-\d{2}$/.test(key) ? f.date(`${key}T00:00:00Z`, { dateStyle: "full", timeZone: "UTC" }) : key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="w-56">
          <Select<Period> aria-label={t("period")} value={period} onValueChange={(v) => v && go({ period: v })} options={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))} />
        </div>
      </div>
      <ListStates
        status={isLoading ? "loading" : isError ? "error" : groups.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        empty={{ icon: <ClockCounterClockwise weight="duotone" />, title: t("noActivityTitle"), description: period === "all" ? t("noActivityBody") : t("noActivityPeriod") }}
      >
        <div className="flex flex-col gap-6">
          {groups.map(([day, list]) => (
            <section key={day} className="flex flex-col gap-3" aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className="text-label text-fg-muted">
                {dayLabel(day)}
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(list as ITaskActivity[]).map((a) => (
                  <li key={a.id}>
                    <TaskActivityCard TaskActivity={a} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {meta && meta.total > (meta.limit || 10) ? <Pagination page={meta.page} pageSize={meta.limit || 10} total={meta.total} onPageChange={(p) => go({ page: p })} /> : null}
        </div>
      </ListStates>
    </div>
  );
}
