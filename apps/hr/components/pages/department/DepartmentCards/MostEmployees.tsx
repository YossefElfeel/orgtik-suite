import { UserCircle } from "@phosphor-icons/react";
import React from "react";
import CardLayout from "./CardLayout";
import { IDepartmentStats } from "@/types/department";

type Props = {
  mostEmployees?: IDepartmentStats["mostEmployees"];
};

import { useFormatter, useTranslations } from "next-intl";

const MostEmployees = ({ mostEmployees }: Props) => {
  const t = useTranslations("departmentPage.cards.mostEmployees");
  const format = useFormatter();
  const items = mostEmployees?.items ?? [];
  const topItems = items.slice(0, 3);

  return (
    <CardLayout
      title={t("title")}
      icon={<UserCircle />}
      className="gap-2 justify-between h-full"
    >
      {topItems.map((item, index) => (
        <div
          key={item.departmentId}
          className="border rounded-md p-2 flex items-center gap-2 h-full"
        >
          <div className="w-10 h-10 rounded-md bg-sunken text-body font-medium flex items-center justify-center">
            {index + 1}
          </div>

          <div className="flex flex-col justify-between flex-1">
            <h4 className="text-body font-medium"><bdi>{item.departmentName}</bdi></h4>
            <p className="text-body text-secondary">
              {t("employeesCount", { count: item.employeeCount })}
            </p>
          </div>

          <div className="text-body font-medium text-primary">
            {format.number(item.employeeShare / 100, {
              style: "percent",
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </div>
        </div>
      ))}
      {!topItems.length && (
        <p className="text-body text-secondary">{t("noData")}</p>
      )}
    </CardLayout>
  );
};

export default MostEmployees;
