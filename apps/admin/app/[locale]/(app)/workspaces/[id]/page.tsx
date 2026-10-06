"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { WorkspaceDetail } from "@/components/customers/WorkspaceDetail";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="workspaces:view">
      <WorkspaceDetail key={id} id={id} />
    </RequirePermission>
  );
}
