"use client";
import {useParams,notFound} from "next/navigation";
import {RequirePermission} from "@/components/frame/RequirePermission";
import {StaffAdministration} from "@/components/studio/StaffAdministration";
export default function Page(){const params=useParams<{section?:string[]}>(),active=params.section?.[0]||"overview";if((params.section?.length||0)>1||!["overview","members","roles","settings","connections","import-export","audit","billing"].includes(active))notFound();return <RequirePermission permission="overview:view"><StaffAdministration active={active}/></RequirePermission>;}
