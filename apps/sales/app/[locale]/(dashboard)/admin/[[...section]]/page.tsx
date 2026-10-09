"use client";
import { use } from "react";
import { ToolAdminScreen, type ToolAdminSection } from "@orgtik/ui";
const SECTIONS: ToolAdminSection[] = ["overview", "members", "roles", "settings", "connections", "import-export", "audit", "billing"];
export default function CrmAdminPage({ params }: { params: Promise<{ section?: string[] }> }) { const { section } = use(params), current = section?.[0] as ToolAdminSection | undefined; return <ToolAdminScreen tool="crm" active={current && SECTIONS.includes(current) ? current : "overview"} />; }
