"use client";
// What one more person costs, said before the invitation goes (USR-14): guests are free; anyone
// else is one more paid seat when they accept, on each per-user line the seat model puts them on.
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import type { AppTool, WorkspaceRole } from "@/redux/features/platform/platformApi";
import type { Team } from "@/redux/features/platform/team";
import { useLocalized } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { linesFor, paysSeat, sumUnits } from "./seats";

export function SeatCost({ team, tools, role, access, currency }: { team: Team; tools: AppTool[]; role: WorkspaceRole; access: string[] | null; currency: string }) {
  const t = useTranslations("Team.cost");
  const f = useFormatter();
  const name = useLocalized();
  const { seats, seatModel, perUserLines } = team.meta;
  if (!paysSeat(role)) return <Notice tone="info" title={t("guestTitle")}>{t("guestBody")}</Notice>;
  const lines = linesFor(perUserLines, seatModel, role, access);
  const toolName = (key: string) => {
    const tool = tools.find((x) => x.key === key);
    return tool ? name(tool.name) : key;
  };
  return (
    <Notice tone="warning" title={t("title", { before: seats, after: seats + 1 })}>
      {lines.length ? (
        <div className="flex flex-col gap-2">
          <p>{t("linesIntro")}</p>
          <ul className="flex flex-col gap-1">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4">
                <span>{toolName(l.tool)}</span>
                <span dir="ltr" className="tabular-nums">
                  +{f.money(l.unit, l.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
            <span>{t("total")}</span>
            <span dir="ltr" className="tabular-nums">
              +{f.money(sumUnits(lines), lines[0]?.currency ?? currency)}
            </span>
          </p>
          <p className="text-fg-muted">{t("when")}</p>
        </div>
      ) : (
        <p>{t("noLines")}</p>
      )}
    </Notice>
  );
}
