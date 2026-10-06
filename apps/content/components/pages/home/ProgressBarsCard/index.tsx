"use client";
import { useTranslations } from "next-intl";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ProgressBarsCardProps {
  topServices: {
    name: string;
    contactCount: number;
    percentage: number;
  }[];
}

export default function ProgressBarsCard({
  topServices,
}: ProgressBarsCardProps) {
  const t = useTranslations("HomePage");

  return (
    <Card className="w-full h-[280px] sm:h-[300px] md:h-[350px] lg:h-full border border-gray-200 bg-white rounded-xl shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-[20px] font-medium">
          {t("top_services")}
        </CardTitle>
        <span className="text-secondary text-sm">
          {t("contacts_statistic")}
        </span>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 h-[220px] md:h-[260px] lg:h-auto overflow-y-auto">
        <div className="space-y-4">
          {topServices.map((service) => (
            <div key={service.name} className="space-y-2">
              {/* Title + percentage */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-sm">{service.name}</span>
                <span className="text-gray-500">
                  {service.percentage ?? 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-primary"
                  style={{ width: `${service.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
