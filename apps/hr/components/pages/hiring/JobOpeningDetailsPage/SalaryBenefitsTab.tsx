import { Coins, CurrencyCircleDollar as CircleDollarSign, UserCircle as CircleUser } from "@phosphor-icons/react";
import { DetailGrid, DetailItem, HeaderedCard } from ".";
import { IJob } from "@/types/job";
import { useFormatter, useTranslations } from "next-intl";

const asYesNo = (value: boolean | undefined, yes: string, no: string) =>
  value ? yes : no;

function SalaryBenefitsTab({ job }: { job?: IJob }) {
  const t = useTranslations("jobs");
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
  const salaryDetailItems: DetailItem[] = [
    {
      id: "currency",
      label: t("jobDetails.labels.currency"),
      value: job?.currencyType ?? "-",
      icon: CircleDollarSign,
    },
    {
      id: "salary-range",
      label: t("jobDetails.labels.salaryRange"),
      value:
        job?.salaryMin && job?.salaryMax
          ? `${formatAmount(job.salaryMin, job.currencyType)} - ${formatAmount(job.salaryMax, job.currencyType)}`
          : "-",
      icon: Coins,
    },
  ];

  const benefitItems: DetailItem[] = [
    {
      id: "bonus",
      label: t("jobDetails.labels.bonusAvailability"),
      value: asYesNo(job?.bonusAvailability, t("common.yes"), t("common.no")),
      icon: CircleDollarSign,
    },
    {
      id: "paid-time-off",
      label: t("jobDetails.labels.paidTimeOff"),
      value: asYesNo(job?.paidTimeOff, t("common.yes"), t("common.no")),
      icon: CircleDollarSign,
    },
    {
      id: "health-insurance",
      label: t("jobDetails.labels.healthInsurance"),
      value: asYesNo(job?.healthInsurance, t("common.yes"), t("common.no")),
      icon: CircleUser,
    },
  ];

  return (
    <div className="space-y-4">
      <HeaderedCard title={t("jobDetails.sections.salaryDetails")} icon={CircleDollarSign}>
        <DetailGrid items={salaryDetailItems} />
      </HeaderedCard>

      <HeaderedCard title={t("jobDetails.sections.benefits")} icon={CircleUser}>
        <DetailGrid items={benefitItems} />
      </HeaderedCard>
    </div>
  );
}

export default SalaryBenefitsTab;
