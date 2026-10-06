"use client";
import { useTranslations } from "next-intl";


import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface WebsiteVisitorsChartProps {
  monthlyVisits: {
    month: string;
    currentYear: number;
    previousYear: number;
  }[];
}

export default function WebsiteVisitorsChart({
  monthlyVisits,
}: WebsiteVisitorsChartProps) {
  const t = useTranslations("HomePage");

  // ✅ default show Monthly directly
  const [period, setPeriod] = useState("Monthly");

  // ✅ Format backend data to match chart
  const chartData = monthlyVisits.map((item) => ({
    month: item.month,
    thisPeriod: item.currentYear,
    prevPeriod: item.previousYear,
  }));

  return (
    <Card className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{t("website_visitors")}</CardTitle>
          <CardDescription>{t("site_traffic")}</CardDescription>
        </div>

        {/* Dropdown (kept for UI even if not switching periods) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {t("monthly")}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              {t("monthly")}
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 sm:h-[280px] md:h-[300px] lg:h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />

            <Line
              type="monotone"
              dataKey="thisPeriod"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name={t("this_year")}
            />

            <Line
              type="monotone"
              dataKey="prevPeriod"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name={t("previous_year")}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
