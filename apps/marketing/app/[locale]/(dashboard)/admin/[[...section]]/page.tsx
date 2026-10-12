"use client";
import { useParams } from "next/navigation";
import { ToolAdminScreen } from "@orgtik/ui";
export default function MarketingAdmin() {
  const params = useParams<{ section?: string[] }>();
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
    />
  );
}
