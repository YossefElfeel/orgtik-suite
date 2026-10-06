"use client";
import { useTranslations } from "next-intl";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogsViewsChartProps {
  blogViewsByService: {
    serviceName: string;
    percentage: number;
    viewCount: number;
  }[];
}

export default function BlogsViewsChart({
  blogViewsByService,
}: BlogsViewsChartProps) {
  const t = useTranslations("HomePage");

  const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          {t("blog_views_by_service")}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t("distribution_blog_views")}
        </p>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={blogViewsByService}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage}%`}
              outerRadius={100}
              dataKey="percentage"
              nameKey="serviceName"
            >
              {blogViewsByService.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name, props) =>
                `${props.payload.percentage}% (${props.payload.viewCount} {t("views")})`
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
