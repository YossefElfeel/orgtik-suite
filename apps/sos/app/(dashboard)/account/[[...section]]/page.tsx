"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SettingsLayout, NoPermissionState, useSuite } from "@orgtik/ui";
import { IdentityLanding } from "@/components/account/IdentityLanding";
import { AccountSettings } from "@/components/account/AccountSettings";
export default function AccountSettingsPage() {
  const { section } = useParams<{ section?: string[] }>(), t = useTranslations("AccountV3"), suite = useSuite(), active = section?.[0] || "security";
  if (active === "identity" && (section?.length || 0) === 1) return <IdentityLanding />;
  if (suite.session && !suite.session.workspaceContext) return <NoPermissionState titleAs="h1" title={t("chooseWorkspace")} description={t("identityIntro")} action={<Link href="/account/identity" className="text-body-sm font-semibold text-fg-brand underline">{t("chooseWorkspace")}</Link>} />;
  const sections = ["security", "preferences", "integrations", "data", "audit", "setup", "danger"];
  if (!sections.includes(active) || (section?.length || 0) > 1) return <NoPermissionState title={t("forbidden")} />;
  return <SettingsLayout title={t("account")} description={t("accountIntro")} active={active} sections={sections.map(id => ({ id, label: t(id), href: `/account/${id}` }))}><AccountSettings active={active} /></SettingsLayout>;
}
