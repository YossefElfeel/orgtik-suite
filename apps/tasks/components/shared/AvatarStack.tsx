"use client";
import { useTranslations } from "next-intl";
import { Avatar, Tooltip } from "@orgtik/ui";

type Person = { id: number | string; firstName?: string; lastName?: string; name?: string; avatar?: string | null };
const nameOf = (p: Person) => p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

/** A few faces and "+N", with every name readable (tooltip and a list for screen readers). */
export function AvatarStack({ people, max = 4, label }: { people: Person[]; max?: number; label?: string }) {
  const t = useTranslations("Common");
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  if (!people.length) return <span className="text-caption text-fg-subtle">{t("nobody")}</span>;
  return (
    <ul className="flex [&>*+*]:-ms-2" aria-label={label ?? t("people", { count: people.length })}>
      {shown.map((p) => (
        <li key={p.id}>
          <Tooltip content={nameOf(p)}>
            <span className="block rounded-pill ring-2 ring-raised">
              <Avatar name={nameOf(p)} src={p.avatar || undefined} size="sm" />
            </span>
          </Tooltip>
        </li>
      ))}
      {rest > 0 ? (
        <li>
          <Tooltip content={people.slice(max).map(nameOf).join(", ")}>
            <span className="grid size-8 place-items-center rounded-pill bg-sunken text-caption text-fg-muted ring-2 ring-raised" aria-label={t("andMore", { count: rest })}>
              +{rest}
            </span>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}
