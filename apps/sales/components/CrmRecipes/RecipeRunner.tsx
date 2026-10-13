"use client";
import { useEffect } from "react";
import { useSuite } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
export function RecipeRunner() {
  const suite = useSuite(), role = useRole();
  useEffect(() => {
    if (!role.canEdit || !suite.snapshot?.tools.crm?.canWrite || suite.snapshot.actor.readOnly) return;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => { clearTimeout(timer); timer = setTimeout(() => { void suite.request("/crm/recipes/run", "POST", {}).catch(() => {}); }, 150); };
    run(); window.addEventListener("orgtik:crm-stage-changed", run);
    return () => { clearTimeout(timer); window.removeEventListener("orgtik:crm-stage-changed", run); };
  }, [role.canEdit, suite.apiUrl, suite.snapshot?.workspace.id, suite.snapshot?.tools.crm?.canWrite, suite.snapshot?.actor.readOnly]);
  return null;
}
