import { ProjectSettings } from "@/components/pages/settings/ProjectSettings";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { getTranslations } from "next-intl/server";
export default async function SettingsPage() {
  const t = await getTranslations("MarketingV3");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/settings/brand" variant="secondary">
          {t("brand")}
        </ButtonLink>
        <ButtonLink href="/settings/senders" variant="secondary">
          {t("senders")}
        </ButtonLink>
      </div>
      <ProjectSettings />
    </div>
  );
}
