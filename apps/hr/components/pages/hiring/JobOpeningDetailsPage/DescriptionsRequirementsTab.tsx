import { UserCircle as CircleUser, UserCircle as UserCircle2 } from "@phosphor-icons/react";
import { HeaderedCard } from ".";
import { IJob } from "@/types/job";
import { useTranslations } from "next-intl";

function DescriptionsRequirementsTab({ job }: { job?: IJob }) {
  const t = useTranslations("jobs");
  const jobSkills = job?.jobSkills ?? [];
  const aboutCompanyDescription = job?.aboutCompanyDescription ?? "-";
  const jobRequirements = job?.jobRequirements ?? "-";

  return (
    <div className="space-y-4">
      <HeaderedCard title={t("jobDetails.sections.aboutCompany")} icon={UserCircle2}>
        <p className="text-[15px] leading-8 font-normal text-secondary">
          {aboutCompanyDescription}
        </p>
      </HeaderedCard>

      <HeaderedCard title={t("jobDetails.sections.jobRequirements")} icon={UserCircle2}>
        <p className="text-[15px] leading-8 text-secondary">{jobRequirements}</p>
      </HeaderedCard>

      <HeaderedCard title={t("jobDetails.sections.skills")} icon={CircleUser}>
        {jobSkills.length ? (
          <div className="flex flex-wrap gap-2">
            {jobSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-[10px] border border-border bg-background px-4 py-2 text-sm leading-[18px] font-medium text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[15px] leading-8 text-secondary">-</p>
        )}
      </HeaderedCard>
    </div>
  );
}
export default DescriptionsRequirementsTab;
