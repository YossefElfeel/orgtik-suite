import { Sparkle as Sparkles } from "@phosphor-icons/react";
import { InfoCard } from "@/components/shared/EmployeeFacts";
import { Tag } from "@orgtik/ui";
import type { IJobApplication } from "@/types/job";
import { useTranslations } from "next-intl";

interface CandidateSkillsSectionProps {
  application?: IJobApplication;
}

export function CandidateSkillsSection({
  application,
}: CandidateSkillsSectionProps) {
  const t = useTranslations("candidateDetails.skills");
  const skills = application?.job?.jobSkills ?? [];

  return (
    <InfoCard title={t("candidateTitle")} icon={Sparkles}>
      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill}>
              <Tag><bdi>{skill}</bdi></Tag>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary">{t("empty")}</p>
      )}
    </InfoCard>
  );
}
