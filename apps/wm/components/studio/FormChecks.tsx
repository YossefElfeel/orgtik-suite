"use client";
import {useTranslations} from "next-intl";
import {Badge,PageHeader,SimulatedTag} from "@orgtik/ui";
import {useStudio} from "@/lib/studio";
import {StudioState} from "./StudioUI";
type Forms={submitted:number;blockedRecent:number;formMode:"preview"|"live";simulatedProtection:true;externalProvider:false};
export function FormChecks(){const t=useTranslations("WmV3"),resource=useStudio<Forms>("/studio/forms");if(!resource.data)return <StudioState resource={resource}/>;const data=resource.data;return <div className="flex flex-col gap-6"><PageHeader title={t("formChecks")} description={t("formBody")}/><SimulatedTag/><Badge className="self-start" tone={data.formMode==="live"?"success":"warning"}>{t(data.formMode==="live"?"formsLive":"formsBeta")}</Badge><dl className="grid gap-3 sm:grid-cols-[max-content_1fr]"><dt>{t("submittedForms")}</dt><dd className="tabular-nums">{data.submitted}</dd><dt>{t("blockedForms")}</dt><dd className="tabular-nums">{data.blockedRecent}</dd></dl><p className="max-w-prose text-body-sm text-fg-muted">{t("protectionBody")}</p></div>;}
