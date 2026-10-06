import { UsersThree } from "@phosphor-icons/react";
import React from "react";
import CardLayout from "./CardLayout";
import { IDepartmentStats } from "@/types/department";

const dotClasses = [
  "bg-action-primary",
  "bg-warning-solid",
  "bg-fg",
  "bg-warning-solid",
  "bg-success-solid",
  "bg-line-strong",
];

import { useFormatter, useTranslations } from "next-intl";

function TotalDepartments({ stats }: { stats: IDepartmentStats }) {
  const t = useTranslations("departmentPage.cards.totalDepartments");
  const format = useFormatter();
  const total = stats?.summary?.totalDepartments ?? 0;
  const fresh = stats?.summary?.newDepartments ?? 0;
  const data = (stats?.absenceByDepartment?.items ?? []).map((item, idx) => {
    const normalized = item as {
      name?: string;
      departmentName?: string;
      absenceRate: number;
    };

    return {
      title: normalized.name ?? normalized.departmentName ?? t("fallbackName"),
      value: normalized.absenceRate ?? 0,
      dotClass: dotClasses[idx % dotClasses.length],
    };
  });

  return (
    <CardLayout
      title={t("title")}
      icon={<UsersThree />}
    >
      <div className="flex items-center gap-1.5">
        <h4 className="text-title-lg font-semibold ">
          {stats?.summary?.totalDepartments}
        </h4>
        {/* The new departments' share of all of them (it divided the other way round, so no new
            departments showed "Infinity%", HR-034); shown only when there are new ones. */}
        {total > 0 && fresh > 0 ? (
          <div className="bg-success-subtle text-success rounded px-2 py-0.5 text-body tabular-nums">
            +{format.number(fresh / total, { style: "percent", maximumFractionDigits: 0 })}
          </div>
        ) : null}
      </div>
      <p className="text-body text-secondary">
        {t("newDepartmentsHint", { count: stats?.summary?.newDepartments })}
      </p>
      <div className="my-4">
        <div className="h-1 w-full rounded-full bg-line-strong overflow-hidden">
          <div className="h-full flex">
            {data.map((item) => (
              <div
                key={item.title}
                style={{ flexGrow: item.value }}
                className={`${item.dotClass} h-full `}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {data.map((item) => (
          <div
            key={item.title}
            className="bg-sunken rounded-lg p-2 flex flex-col items-center justify-center gap-1 "
          >
            <div className="flex items-center gap-1">
              <div className={`h-1 w-2.5 rounded-full ${item.dotClass}`} />
              <p
                className="text-caption text-secondary line-clamp-1"
                title={item.title}
              >
                <bdi>{item.title}</bdi>
              </p>
            </div>
            <p className="text-body-lg font-medium tabular-nums">{format.number(item.value / 100, { style: "percent", maximumFractionDigits: 1 })}</p>
          </div>
        ))}
      </div>
    </CardLayout>
  );
}

export default TotalDepartments;
