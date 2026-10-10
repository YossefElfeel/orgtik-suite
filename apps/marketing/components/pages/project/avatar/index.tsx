"use client";
import {useState} from "react";
import {useTranslations} from "next-intl";
import {Trash} from "@phosphor-icons/react";
import {Avatar,Button,Card} from "@orgtik/ui";
import {useDeleteAvatarMutation} from "@/redux/features/projects/projectApi";
import type {IProject} from "@/types/projects";
export default function ProjectLogo({project,canEdit}:{project:IProject;canEdit:boolean}) {
 const t=useTranslations("ProjectSettings"),tv=useTranslations("MarketingV3"),[remove,state]=useDeleteAvatarMutation(),[error,setError]=useState(false);
 return <Card padding="lg" className="flex flex-col gap-4"><h2 className="font-display text-title-sm">{t("logoTitle")}</h2><p className="text-body-sm text-fg-muted">{tv("assetsDeferred")}</p><Avatar name={project.name} src={project.avatar} size="lg"/>{canEdit&&project.avatar?<Button className="self-start" variant="ghost" size="sm" startIcon={<Trash/>} loading={state.isLoading} onClick={async()=>{setError(false);try{await remove(project.id).unwrap();}catch{setError(true);}}}>{t("removeLogo")}</Button>:null}{error?<p role="alert" className="text-body-sm text-danger">{t("logoRemoveFailed")}</p>:null}</Card>;
}
