"use client";
import { IdentificationCard } from "@phosphor-icons/react";

import CardLayout from "./CardLayout";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { IDepartmentStats } from "@/types/department";

type Props = {
  absenceByDepartment?: IDepartmentStats["absenceByDepartment"];
  isLoading?: boolean;
};

// The library's data-viz slots (CVD-checked, themed); the last, neutral one is the "rest" share.
const chartColors = ["var(--ot-viz-1)", "var(--ot-viz-6)", "var(--ot-viz-5)", "var(--ot-viz-3)", "var(--ot-line-strong)"];

function SemiGauge({
  chartData,
  chartConfig,
  chartKeys,
  overallRate,
}: {
  chartData: Record<string, number>[];
  chartConfig: ChartConfig;
  chartKeys: string[];
  overallRate: string;
}) {
  return (
    <div className="flex items-center justify-center">
      <ChartContainer config={chartConfig} className="w-full h-[180px]">
        <RadialBarChart
          data={chartData}
          endAngle={180}
          innerRadius={60}
          outerRadius={85}
        >
          {chartKeys.map((key) => (
            <RadialBar
              key={key}
              dataKey={key}
              fill={chartConfig[key]?.color}
              stackId="a"
              cornerRadius={4}
              className="stroke-transparent stroke-2"
            />
          ))}
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 8}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {overallRate}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}

import { useFormatter, useTranslations } from "next-intl";

function AbsenceRate({ absenceByDepartment }: Props) {
  const t = useTranslations("departmentPage.cards.absenceRate");
  const format = useFormatter();
  const items = absenceByDepartment?.items ?? [];
  const topItems = items.slice(0, 5);

  const chartConfig = topItems.reduce((acc, item, index) => {
    const key = `department_${index}`;
    acc[key] = {
      label: item.departmentName,
      color: chartColors[index % chartColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  const chartData = [
    topItems.reduce(
      (acc, item, index) => {
        acc[`department_${index}`] = item.absenceRate;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ];

  const chartKeys = Object.keys(chartConfig);
  const topDepartment = absenceByDepartment?.topDepartment;
  const overallRate = absenceByDepartment?.overallAbsenceRate ?? 0;

  return (
    <CardLayout
      title={t("title")}
      icon={<IdentificationCard />}
      className="gap-2 justify-between"
    >
      <SemiGauge
        chartData={chartData}
        chartConfig={chartConfig}
        chartKeys={chartKeys}
        overallRate={format.number(overallRate / 100, { style: "percent", maximumFractionDigits: 1 })}
      />

      <div
        className="
      border rounded-md p-2 flex items-center gap-2 -mt-6"
      >
        <div className="w-10 h-10 rounded-md bg-sunken text-body font-medium flex items-center justify-center">
          1
        </div>

        <div className="flex flex-col justify-between flex-1">
          <h4 className="text-body font-medium">
            {topDepartment?.departmentName ? (
              <bdi>{topDepartment.departmentName}</bdi>
            ) : (
              t("noData")
            )}
          </h4>
          <p className="text-body text-secondary">
            {t("absentDays", { count: topDepartment?.absentDays ?? 0 })}
          </p>
        </div>

        <div className="text-body font-medium text-primary">
          {format.number((topDepartment?.absenceRate ?? 0) / 100, {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </div>
      </div>
    </CardLayout>
  );
}

export default AbsenceRate;
