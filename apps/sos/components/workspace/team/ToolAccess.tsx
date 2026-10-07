"use client";
// Choose supported tools subscribed now. The server freezes concrete grants and reservations.
import { useTranslations } from "next-intl";
import { Checkbox, Field, RadioGroup } from "@orgtik/ui";
import type { AppTool } from "@/redux/features/platform/platformApi";
import { useLocalized } from "@/components/workspace/account/problems";

export function ToolAccess({ tools, value, onChange, error, disabled = false }: { tools: AppTool[]; value: string[] | null; onChange: (v: string[] | null) => void; error?: string; disabled?: boolean }) {
  const t = useTranslations("Team.access");
  const name = useLocalized();
  return (
    <div className="flex flex-col gap-3">
      <Field label={t("label")} group>
        <RadioGroup
          value={value === null ? "all" : "some"}
          onValueChange={(v) => onChange(v === "all" ? null : (value ?? []))}
          options={[
            { value: "all", label: t("all"), description: t("allHint"), disabled },
            { value: "some", label: t("some"), description: t("someHint"), disabled },
          ]}
        />
      </Field>
      {value !== null ? (
        <Field label={t("which")} group error={error}>
          <div className="grid gap-2 sm:grid-cols-2">
            {tools.map((tool) => (
              <Checkbox
                key={tool.key}
                disabled={disabled}
                label={name(tool.name)}
                checked={value.includes(tool.key)}
                onCheckedChange={(on) => onChange(on ? [...value, tool.key] : value.filter((k) => k !== tool.key))}
              />
            ))}
          </div>
        </Field>
      ) : null}
    </div>
  );
}
