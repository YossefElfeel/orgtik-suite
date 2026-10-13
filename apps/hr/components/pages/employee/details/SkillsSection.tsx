import { User } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import { Badge } from "@orgtik/ui";
import { Skeleton } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";
type SkillsSectionProps = {
    skills: string[];
    isLoading?: boolean;
  onEdit?: () => void;
};
export function SkillsSection({ skills = [], isLoading, onEdit }: SkillsSectionProps) {
    const t = useTranslations("employees.details.sections");
    const labels = useEmployeeLabels();
    if (isLoading) {
        return (<InfoCardSkeleton itemCount={0}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-8 w-24 rounded-full"/>))}
        </div>
      </InfoCardSkeleton>);
    }
    return (<InfoCard title={t("skills")} icon={User} onEdit={onEdit}>
      <div className="flex flex-wrap gap-2">
        {skills?.map((skill) => (<Badge key={skill} className="px-3 py-1.5 text-sm font-normal text-secondary border-border">
            {labels.skillCode(skill) ?? <bdi>{skill}</bdi>}
          </Badge>))}
      </div>
    </InfoCard>);
}
