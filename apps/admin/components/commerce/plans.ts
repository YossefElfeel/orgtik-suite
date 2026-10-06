"use client";
import { useTranslations } from "next-intl";
import { usePick } from "@/components/system/kit";
import { useCommercePlansQuery, type PlanOption } from "@/store/commerce";

const TOOLS = ["general", "tasks", "files", "chat", "hr", "crm", "marketing", "email", "website", "hosting"];

/** Plans as "Tasks · Pro", for pickers and chips. Plans without a tool (services) are left out. */
export function usePlanNames() {
  const t = useTranslations("Commerce");
  const pick = usePick();
  const plans = useCommercePlansQuery();
  const tool = (k: string | null) => (k && TOOLS.includes(k) ? t(`tools.${k}`) : (k ?? ""));
  const label = (p: PlanOption) => `${tool(p.tool)} · ${pick(p.name)}`;
  const byId = new Map((plans.data ?? []).map((p) => [p.id, p]));
  return {
    plans: (plans.data ?? []).filter((p) => p.tool),
    isLoading: plans.isLoading,
    error: plans.error,
    label,
    /** A plan id's name; the id itself while plans load or when the role can't read them. */
    nameOf: (id: string) => {
      const p = byId.get(id);
      return p ? label(p) : id;
    },
    tool,
  };
}
