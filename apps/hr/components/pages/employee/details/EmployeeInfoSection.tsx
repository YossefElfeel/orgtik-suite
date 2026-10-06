import { Briefcase, Buildings as Building2, CalendarBlank as Calendar, CheckCircle as CheckCircle2, Hash, User, UserCheck as UserCheck2 } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/ui/info-card";
import type { Employee } from "./types";
import type { IEmployeeInformation } from "@/types/employee";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";

type EmployeeInfoSectionProps = {
  employeeInfo?: IEmployeeInformation;
  joinDateLabel: string;
  employeeId: string;
  isLoading?: boolean;
};

export function EmployeeInfoSection({
  employeeInfo,
  joinDateLabel,
  employeeId,
  isLoading,
}: EmployeeInfoSectionProps) {
  const t = useTranslations("employees.details.sections");
  const tFields = useTranslations("createUpdateEmployee.fields");
  const tHeader = useTranslations("employeeDetails.header");
  const labels = useEmployeeLabels();

  if (isLoading) return <InfoCardSkeleton itemCount={7} />;

  return (
    <InfoCard
      title={t("employee")}
      icon={Briefcase}
      onEdit={() => {}}
      items={[
        {
          id: "emp-id",
          label: tFields("employeeCode"),
          value: employeeId,
          userContent: true,
          icon: Hash,
        },
        {
          id: "dept",
          label: tFields("department"),
          value: employeeInfo?.departmentName || "-",
          userContent: true,
          icon: Building2,
        },
        {
          id: "job-title",
          label: tFields("jobTitle"),
          value: employeeInfo?.jobTitle || "-",
          userContent: true,
          icon: Briefcase,
        },
        {
          id: "join-date",
          label: tFields("joinDate"),
          value: employeeInfo?.joinDate || joinDateLabel,
          icon: Calendar,
        },
        {
          id: "emp-type",
          label: tFields("employeeType"),
          value: labels.employmentType(employeeInfo?.employeeType),
          icon: UserCheck2,
        },
        {
          id: "status",
          label: tFields("status"),
          value: employeeInfo?.status ? labels.status(employeeInfo.status) : tHeader("statusActive"),
          icon: CheckCircle2,
        },
        {
          id: "manager",
          label: tFields("manager"),
          value: employeeInfo?.managerName || "-",
          userContent: true,
          icon: User,
        },
      ]}
    />
  );
}

