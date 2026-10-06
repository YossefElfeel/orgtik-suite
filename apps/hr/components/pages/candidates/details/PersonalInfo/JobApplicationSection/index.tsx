import { Briefcase, Buildings as Building2, ChartBar as BarChart2, CheckCircle as CheckCircle2, CurrencyDollar as DollarSign } from "@phosphor-icons/react";
import { InfoCard } from "@/components/ui/info-card";
import type { IJobApplication } from "@/types/job";
import { useFormatter, useTranslations } from "next-intl";

interface JobApplicationSectionProps {
  application?: IJobApplication;
}

export function JobApplicationSection({ application }: JobApplicationSectionProps) {
  const t = useTranslations("candidateDetails.jobApplication");
  const tJobs = useTranslations("jobs");
  const format = useFormatter();

  const formatAmount = (value: number | string, currency?: string) => {
    const amount = Number(value);
    if (!currency) return format.number(amount);
    try {
      return format.number(amount, { style: "currency", currency });
    } catch {
      return `${currency} ${format.number(amount)}`;
    }
  };

  const formatSalaryRange = () => {
    const salaryMin = application?.job?.salaryMin;
    const salaryMax = application?.job?.salaryMax;
    const currency = application?.job?.currencyType;

    if (!salaryMin || !salaryMax) return "-";

    return `${formatAmount(salaryMin, currency)} - ${formatAmount(salaryMax, currency)}`;
  };

  const experienceLevel = application?.job?.experienceLevel;
  const experienceLevelKey = `addJobSheet.options.experienceLevel.${experienceLevel}`;
  const currentStage = application?.currentStage;
  const currentStageKey = `stages.${currentStage}`;

  const jobApplicationItems = [
    {
      icon: Briefcase,
      label: t("jobTitle"),
      value: application?.job?.title || "-",
      userContent: true,
    },
    {
      icon: BarChart2,
      label: t("experienceLevel"),
      value: experienceLevel
        ? tJobs.has(experienceLevelKey)
          ? tJobs(experienceLevelKey)
          : experienceLevel
        : "-",
    },
    {
      icon: DollarSign,
      label: t("salary"),
      value: formatSalaryRange(),
    },
    {
      icon: CheckCircle2,
      label: t("currentStage"),
      value: currentStage
        ? tJobs.has(currentStageKey)
          ? tJobs(currentStageKey)
          : currentStage
        : "-",
    },
    {
      icon: Building2,
      label: t("department"),
      value: application?.job?.department?.name || "-",
      userContent: true,
    },
  ];

  return (
    <InfoCard title={t("title")} icon={Briefcase}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {jobApplicationItems.map((item) => (
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
