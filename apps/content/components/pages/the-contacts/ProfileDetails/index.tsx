import { useTranslations } from "next-intl";
import { ContactsResponseId } from "@/types/contacts";
import Link from "next/link";
interface ProfileDetailsProps {
  data?: ContactsResponseId;
}
function ProfileDetails({ data }: ProfileDetailsProps) {
  const t = useTranslations("ContactsPage");

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 pb-2 mb-4">
        <h3 className="font-semibold text-lg ">{t("profile_details_title")}</h3>
        <span className="text-sm text-secondary">
          {t("profile_details_subtitle")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3 ">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium ">{t("full_name")}</span>
            <span className="text-sm text-secondary">
              {data?.firstName || "—"} {data?.lastName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("email")}</span>
            <span className="text-sm text-secondary">{data?.email || "—"}</span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium ">{t("ip_address")}</span>
            <span className="text-sm text-secondary">
              {/* {profileDetails?.ipAdress || "—"} */}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium ">{t("phone_number")}</span>
            <span className="text-sm ">{data?.phoneNumber || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("company_name")}</span>
            <span className="text-sm">{data?.companyName || "__"}</span>
          </div>
          <div className="flex items-center justify-baseline">
            {/* <span> {data?.service.title.en}</span> */}
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetails;
