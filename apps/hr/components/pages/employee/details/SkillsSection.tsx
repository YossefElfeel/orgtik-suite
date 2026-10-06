import { User } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";

type SkillsSectionProps = {
  skills: string[];
  isLoading?: boolean;
};

export function SkillsSection({ skills = [], isLoading }: SkillsSectionProps) {
  const t = useTranslations("employees.details.sections");
  const labels = useEmployeeLabels();

  if (isLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </InfoCardSkeleton>
    );
  }

  return (
    <InfoCard title={t("skills")} icon={User} onEdit={() => {}}>
      <div className="flex flex-wrap gap-2">
        {skills?.map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className="px-3 py-1.5 text-sm font-normal text-secondary border-border"
          >
            {labels.skillCode(skill) ?? <bdi>{skill}</bdi>}
          </Badge>
        ))}
      </div>
    </InfoCard>
  );
}
