import { Cake, Envelope as Mail, Flag, MapPin, Phone, User, Users } from "@phosphor-icons/react";
import { InfoCard } from "@/components/ui/info-card";
import type { IJobApplication } from "@/types/job";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";

interface PersonalInfoSectionProps {
  application?: IJobApplication;
}

export function PersonalInfoSection({ application }: PersonalInfoSectionProps) {
  const t = useTranslations("candidateDetails.personalInfo");
  const tGender = useTranslations("createUpdateEmployee.options.gender");
  const labels = useEmployeeLabels();
  const gender = application?.gender?.trim();
  const genderKey = gender?.toLowerCase();
  const genderLabel = genderKey && tGender.has(genderKey) ? tGender(genderKey) : gender;
  const personalInfoItems = [
    {
      icon: User,
      label: t("fullName"),
      value: application?.fullName || "-",
      userContent: true,
    },
    {
      icon: Users,
      label: t("gender"),
      value: genderLabel || "-",
    },
    {
      icon: Mail,
      label: t("emailAddress"),
      value: application?.email || "-",
      userContent: true,
    },
    {
      icon: Flag,
      label: t("nationality"),
      value: labels.nationality(application?.nationality),
    },
    {
      icon: Phone,
      label: t("phoneNumber"),
      value: application?.phoneNumber ? <bdi dir="ltr">{application.phoneNumber}</bdi> : "-",
    },
    {
      icon: Cake,
      label: t("dateOfBirth"),
      value: application?.dateOfBirth ? formatDate(application.dateOfBirth) : "-",
    },
    {
      icon: MapPin,
      label: t("address"),
      value: application?.address || "-",
      userContent: true,
    },
  ];

  return (
    <InfoCard title={t("title")} icon={User}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {personalInfoItems.map((item) => (
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
