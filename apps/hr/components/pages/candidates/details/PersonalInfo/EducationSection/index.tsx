import { Buildings as Building2, CalendarBlank as Calendar, GraduationCap } from "@phosphor-icons/react";
import { InfoCard } from "@/components/shared/EmployeeFacts";
import type { IJobApplication } from "@/types/job";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";

interface EducationSectionProps {
  application?: IJobApplication;
}

export function EducationSection({ application }: EducationSectionProps) {
  const t = useTranslations("candidateDetails.education");
  const educationItems = [
    {
      icon: Building2,
      label: t("university"),
      value: application?.university || "-",
      userContent: true,
    },
    {
      icon: GraduationCap,
      label: t("qualification"),
      value: application?.qualification || "-",
      userContent: true,
    },
    {
      icon: Calendar,
      label: t("graduationDate"),
      value: application?.graduationDate
        ? formatDate(application.graduationDate)
        : "-",
    },
  ];

  return (
    <InfoCard title={t("title")} icon={GraduationCap}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {educationItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 w-[150px] shrink-0">
              <item.icon className="size-4 shrink-0 text-fg-subtle" />
              <p className=" shrink-0 text-body font-normal text-fg-subtle">
                {item.label}
              </p>
            </div>
            <p className="text-body font-medium text-fg">
              {item.userContent && item.value !== "-" ? <bdi>{item.value}</bdi> : item.value}
            </p>
          </div>
        ))}
      </div>
    </InfoCard>
  );
}
