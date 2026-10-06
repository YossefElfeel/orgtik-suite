"use client";

// A few faces and "+N" (MKT-047): the old cell drew every avatar and then added "+N" on top, so five
// approvers showed five faces and "+2", and a missing name read "undefined undefined".
import { useTranslations } from "next-intl";
import { Avatar, Tooltip } from "@orgtik/ui";

export type StackPerson = { id: number | string; firstName?: string; lastName?: string; name?: string; email?: string; avatar?: string | null };
export const personName = (p: StackPerson) => (p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`).trim() || p.email || "";

export function AvatarStack({ people, max = 3, label }: { people: StackPerson[]; max?: number; label?: string }) {
  const t = useTranslations("PostShared");
  const named = people.filter((p) => personName(p));
  const shown = named.slice(0, max);
  const rest = named.length - shown.length;
  if (!named.length) return <span className="text-caption text-fg-subtle">{t("nobody")}</span>;
  return (
    <ul className="flex [&>*+*]:-ms-2" aria-label={label ?? t("people", { count: named.length })}>
      {shown.map((p) => (
        <li key={p.id}>
          <Tooltip content={personName(p)}>
            <span className="block rounded-pill ring-2 ring-raised">
              <Avatar name={personName(p)} src={p.avatar || undefined} size="sm" />
            </span>
          </Tooltip>
        </li>
      ))}
      {rest > 0 ? (
        <li>
          <Tooltip content={named.slice(max).map(personName).join(", ")}>
            <span role="img" className="grid size-8 place-items-center rounded-pill bg-sunken text-caption text-fg-muted ring-2 ring-raised" aria-label={t("andMore", { count: rest })}>
              +{rest}
            </span>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}
