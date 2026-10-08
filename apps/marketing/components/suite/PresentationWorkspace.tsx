"use client";
import { useTranslations } from "next-intl";
import { useDemoScene } from "@orgtik/ui";
import { marketingWorkspaces } from "@/components/pages/presentation/model";

export function PresentationWorkspace(){
 const t=useTranslations("Presentation"),{scene}=useDemoScene();
 const name=scene.workspace==="new"?t("emptyWorkspaceLabel"):marketingWorkspaces[scene.workspace];
 return <div role="group" aria-label={t("presentationWorkspace")} className="flex min-w-0 max-w-64 flex-col text-body-sm"><span className="text-caption text-fg-muted">{t("presentationWorkspace")}</span><bdi className="truncate font-semibold">{name}</bdi></div>;
}
