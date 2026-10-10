"use client";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SettingsLayout, NoPermissionState } from "@orgtik/ui";
import { IdentityLanding } from "@/components/account/IdentityLanding";
import { AccountSettings } from "@/components/account/AccountSettings";
export default function AccountSettingsPage() {
  const { section } = useParams<{ section?: string[] }>(), t = useTranslations("AccountV3"), active = section?.[0] || "security";
  if (active === "identity" && (section?.length || 0) === 1) return <IdentityLanding />;
  const sections = ["security", "preferences", "integrations", "data", "audit", "setup", "danger"];
  if (!sections.includes(active) || (section?.length || 0) > 1) return <NoPermissionState title={t("forbidden")} />;
  return <SettingsLayout title={t("account")} description={t("accountIntro")} active={active} sections={sections.map(id => ({ id, label: t(id), href: `/account/${id}` }))}><AccountSettings active={active} /></SettingsLayout>;
}
