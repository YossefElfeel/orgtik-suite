"use client";
import { SuiteProvider, useSuite, toolFromScope } from "@orgtik/ui";
import { API_URL } from "@/constants/env";
import { ToolAccessAction } from "./ToolAccessAction";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useTranslations } from "next-intl";

export function ToolRecovery({ scope }: { scope: string }) {
  return <SuiteProvider apiUrl={API_URL} sosUrl=""><Recovery scope={scope} /></SuiteProvider>;
}
function Recovery({ scope }: { scope: string }) {
  const suite = useSuite(), t = useTranslations("AccountV3");
  return <div className="flex flex-wrap items-center justify-center gap-3"><ToolAccessAction toolKey={scope} trial={suite.isOwner && Boolean(toolFromScope(scope) && suite.toolState(toolFromScope(scope)!)?.access === "not_subscribed")} />{suite.isOwner ? <ButtonLink href="/tools">{t("addTool")}</ButtonLink> : null}<ButtonLink href="/account/identity">{t("chooseWorkspace")}</ButtonLink></div>;
}
