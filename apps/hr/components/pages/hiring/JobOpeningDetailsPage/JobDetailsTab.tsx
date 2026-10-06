import { Briefcase as BriefcaseBusiness, Buildings as Building2, CalendarDots as CalendarDays, Coins, MapPin, SealCheck as BadgeCheck, ShieldPlus, UserCircle as UserCircle2 } from "@phosphor-icons/react";
import { DetailGrid, DetailItem, HeaderedCard } from ".";
import { IJob } from "@/types/job";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";
import { REQUIRED_EXPERIENCE_YEARS } from "../AddJobSheet/constants";

const normalizeLabel = (value?: string) => {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDate(value);
};

function JobDetailsTab({ job }: { job?: IJob }) {
  const t = useTranslations("jobs");
  const optionLabel = (group: "jobType" | "jobMode" | "experienceLevel", value?: string) => {
    if (!value) return "-";
    const key = `addJobSheet.options.${group}.${value}`;
    return t.has(key) ? t(key) : normalizeLabel(value);
  };
  const requiredExperience = job?.requiredExperience;
  const requiredExperienceYears = requiredExperience
    ? REQUIRED_EXPERIENCE_YEARS[requiredExperience]
    : undefined;
  const jobApplicationItems: DetailItem[] = [
    {
      id: "job-title",
      label: t("jobDetails.labels.jobTitle"),
      value: job?.title ?? "-",
      icon: BriefcaseBusiness,
    },
    {
      id: "location",
      label: t("jobDetails.labels.location"),
      value: job?.location ?? "-",
      icon: MapPin,
    },
    {
      id: "job-type",
      label: t("jobDetails.labels.jobType"),
      value: optionLabel("jobType", job?.jobType),
      icon: CalendarDays,
    },
    {
      id: "required-experience",
      label: t("jobDetails.labels.requiredExperience"),
      value:
        requiredExperienceYears !== undefined
          ? t("addJobSheet.options.requiredExperienceYears", { count: requiredExperienceYears })
          : requiredExperience || "-",
      icon: BadgeCheck,
    },
    {
      id: "job-module",
      label: t("jobDetails.labels.jobMode"),
      value: optionLabel("jobMode", job?.jobMode),
      icon: Building2,
    },
    {
      id: "experience-level",
      label: t("jobDetails.labels.experienceLevel"),
      value: optionLabel("experienceLevel", job?.experienceLevel),
      icon: ShieldPlus,
    },
    {
      id: "industry",
      label: t("jobDetails.labels.industry"),
      value: job?.department?.name ?? "-",
      icon: Coins,
    },
  ];

  const postDateItems: DetailItem[] = [
    {
      id: "start-date",
      label: t("jobDetails.labels.startDate"),
      value: normalizeDate(job?.startDate),
      icon: CalendarDays,
    },
    {
      id: "end-date",
      label: t("jobDetails.labels.endDate"),
      value: normalizeDate(job?.endDate),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-4">
      <HeaderedCard title={t("jobDetails.sections.jobApplication")} icon={UserCircle2}>
        <DetailGrid items={jobApplicationItems} />
      </HeaderedCard>

      <HeaderedCard title={t("jobDetails.sections.postDate")} icon={CalendarDays}>
        <DetailGrid items={postDateItems} />
      </HeaderedCard>
    </div>
  );
}

export default JobDetailsTab;
