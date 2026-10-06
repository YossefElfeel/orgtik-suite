"use client";
// Which workspace the person is in, and the way to another one when they belong to several
// (USR-00). Their role there sits next to the name, since it decides what they can do.
import { useTranslations } from "next-intl";
import { Buildings, CaretDown, Check } from "@phosphor-icons/react";
import { Badge, Button, Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@orgtik/ui";
import type { AppMe } from "@/redux/features/platform/platformApi";

export function WorkspaceSwitcher({ me, onSwitch }: { me: AppMe; onSwitch: (id: string) => void }) {
  const t = useTranslations("Workspace");
  const current = me.workspace;
  const label = (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Buildings aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
      <bdi dir="auto" className="truncate font-semibold text-fg">
        {current.name}
      </bdi>
      <Badge size="sm" tone="neutral">
        {t(`roles.${current.role}`)}
      </Badge>
    </span>
  );
  if (me.workspaces.length < 2) return <span className="inline-flex min-w-0 items-center">{label}</span>;
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" endIcon={<CaretDown />} aria-label={t("switchLabel", { name: current.name })} />}>{label}</MenuTrigger>
      <MenuContent align="start">
        <MenuLabel>{t("yourWorkspaces")}</MenuLabel>
        {me.workspaces.map((w) => (
          <MenuItem key={w.id} icon={w.id === current.id ? <Check /> : <span className="size-4" />} onClick={() => w.id !== current.id && onSwitch(w.id)}>
            <span className="flex min-w-0 flex-col">
              <bdi dir="auto" className="truncate">
                {w.name}
              </bdi>
              <span className="text-caption text-fg-subtle">{t(`roles.${w.role}`)}</span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
