import { Cake, Code as Code2, Envelope as Mail, Flag, MapPin, Phone, ScanSmiley as ScanFace, User, Users } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import type { IPersonalInformation } from "@/types/employee";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";

type PersonalInfoSectionProps = {
  personalInfo?: IPersonalInformation;
  isLoading?: boolean;
  onEdit?: () => void;
};

export function PersonalInfoSection({ personalInfo, isLoading, onEdit }: PersonalInfoSectionProps) {
  const t = useTranslations("employees.details.sections");
  const tFields = useTranslations("createUpdateEmployee.fields");
  const tPersonal = useTranslations("employees.details.personal");
  const labels = useEmployeeLabels();
  // Numbers start with + or digits: kept left-to-right so Arabic doesn't move the + to the end.
  const ltr = (v?: string | null) => (v ? <bdi dir="ltr">{v}</bdi> : "-");

  if (isLoading) return <InfoCardSkeleton itemCount={9} />;

  return (
    <InfoCard
      title={t("personal")}
      icon={User}
      onEdit={onEdit}
      items={[
        {
          id: "full-name",
          label: tPersonal("fullName"),
          value: personalInfo?.fullName,
          userContent: true,
          icon: User,
        },
        {
          id: "gender",
          label: tFields("gender"),
          value: labels.gender(personalInfo?.gender),
          icon: Users
        },
        {
          id: "dob",
          label: tFields("birthDate"),
          value: personalInfo?.birthday || "-",
          icon: Cake,
        },
        {
          id: "tax-id",
          label: tFields("personalTaxId"),
          value: ltr(personalInfo?.personalTaxId),
          icon: ScanFace,
        },
        {
          id: "nationality",
          label: tFields("nationality"),
          value: labels.nationality(personalInfo?.nationality),
          icon: Flag,
        },
        {
          id: "phone",
          label: tFields("phoneNumber"),
          value: ltr(personalInfo?.phoneNumber),
          icon: Phone,
        },
        {
          id: "email",
          label: tFields("email"),
          value: personalInfo?.email || "-",
          userContent: true,
          icon: Mail,
        },
        {
          id: "post-code",
          label: tFields("addressPostal"),
          value: ltr(personalInfo?.address?.postCode),
          icon: Code2,
        },
        {
          id: "address",
          label: tFields("addressLine1"),
          value: personalInfo?.address
            ? `${personalInfo.address.street}, ${personalInfo.address.city}, ${personalInfo.address.country}`
            : "-",
          userContent: true,
          icon: MapPin,
        },
      ]}
    />
  );
}

