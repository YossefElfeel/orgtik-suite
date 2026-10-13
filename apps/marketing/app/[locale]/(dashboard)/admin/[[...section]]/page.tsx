"use client";
import { useParams } from "next/navigation";
import { ToolAdminScreen } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/shared/ButtonLink";
export default function MarketingAdmin() {
  const params = useParams<{ section?: string[] }>();
  const t = useTranslations("MarketingV3");
  return (
    <ToolAdminScreen
      tool="marketing"
      active={
        (
          [
            "overview",
            "members",
            "roles",
            "settings",
            "connections",
            "import-export",
            "audit",
            "billing",
          ] as const
        ).find((value) => value === params.section?.[0]) || "overview"
      }
      basePath="/admin"
    >
      {params.section?.[0] === "settings" ? (
        <section className="flex flex-col gap-3 border-t border-line pt-4">
          <h2 className="text-body font-semibold">
            {t("marketingConfiguration")}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {(
              [
                ["brand", "/settings/brand"],
                ["senders", "/settings/senders"],
                ["contacts", "/our-audience/contacts"],
                ["utmSettings", "/settings/utm"],
              ] as const
            ).map(([key, path]) => (
              <li key={key}>
                <ButtonLink href={path} variant="secondary">
                  {t(key)}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ToolAdminScreen>
  );
}
