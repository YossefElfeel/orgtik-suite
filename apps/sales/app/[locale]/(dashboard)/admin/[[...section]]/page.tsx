"use client";
import { use } from "react";
import CrmSettings from "@/components/CrmSettings";
import CrmWorkbench from "@/components/CrmWorkbench";
import { ToolAdminScreen, type ToolAdminSection } from "@orgtik/ui";
const SECTIONS: ToolAdminSection[] = ["overview", "members", "roles", "settings", "connections", "import-export", "audit", "billing"];
export default function CrmAdminPage({ params }: { params: Promise<{ locale: string; section?: string[] }> }) { const { locale, section } = use(params), current = section?.[0] as ToolAdminSection | undefined; const active = current && SECTIONS.includes(current) ? current : "overview"; return <ToolAdminScreen tool="crm" active={active} basePath={`/${locale}/admin`}>{active === "settings" ? <CrmSettings /> : active === "import-export" ? <CrmWorkbench /> : null}</ToolAdminScreen>; }
