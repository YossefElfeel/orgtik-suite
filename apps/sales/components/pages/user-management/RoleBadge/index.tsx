"use client";

import { useTranslations } from "next-intl";
import { Badge, type Tone } from "@orgtik/ui";
import type { UserRole } from "@/types/users";

const TONES: Record<UserRole, Tone> = { admin: "brand", manager: "info", salesman: "neutral" };

/** A staff member's CRM role, in words. */
export default function RoleBadge({ role }: { role: UserRole | string | null | undefined }) {
  const t = useTranslations("Team.users");
  if (!role || !(role in TONES)) return <span className="text-fg-subtle">—</span>;
  return (
    <Badge tone={TONES[role as UserRole]} size="sm">
      {t(`role.${role}`)}
    </Badge>
  );
}
