"use client";

/**
 * SOMION HQ - ROLE SWITCHER
 *
 * A prototype affordance, and it is labelled as one. It lets a presenter show
 * what an admin sees and what a member sees without signing out and back in,
 * which is otherwise the most awkward two minutes of any demo.
 *
 * In production this control does not exist: the role comes from the SaaS
 * layer's session, and a person cannot promote themselves by opening a menu.
 * Saying that on the control itself is cheaper than being asked.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useEffect, useRef, useState } from "react";
import { Check, UserSwitch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { CAPABILITIES, ROLE_BLURB, ROLE_LABEL, ROLE_ORDER } from "@/lib/roles";
import { useT } from "@/lib/i18n";
import type { Role } from "@/entities";

export function RoleSwitcher() {
  const role = useWorkspace((s) => s.viewingRole);
  const setRole = useWorkspace((s) => s.setViewingRole);
  const guestKey = useWorkspace((s) => s.meetings[0]?.guestKey);
  const [open, setOpen] = useState(false);
  useBackToClose(open, () => setOpen(false));
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t("role.switchTitle", "Viewing as {role}", { role: t(`role.${role}`, ROLE_LABEL[role]) })}
      >
        <UserSwitch size={15} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
        <span className="hidden text-[12.5px] lg:inline" style={{ color: "var(--color-ink-muted)" }}>
          {t(`role.${role}`, ROLE_LABEL[role])}
        </span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t("role.dialog", "Switch role")}
          className="hq-floating hq-rise hq-dropdown absolute end-0 z-[70] mt-2 w-[300px] p-2"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="px-2 pb-1.5 pt-1">
            <p className="text-[12.5px] font-semibold" style={{ color: "var(--color-ink)" }}>
              {t("role.viewAs", "View the workspace as")}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--color-ink-muted)" }}>
              {t(
                "role.prototypeOnly",
                "A prototype control. In the real product the role comes from your Business OS account and nobody can change their own.",
              )}
            </p>
          </div>

          <ul className="mt-1 flex flex-col">
            {ROLE_ORDER.filter((r) => r !== "guest").map((r) => (
              <RoleRow key={r} role={r} current={role} onPick={(x) => { setRole(x); setOpen(false); }} />
            ))}
          </ul>

          {/* The guest view is a different product surface, not a role you can
              wear inside the shell, so it links out rather than switching. */}
          <a
            href={`/guest/${guestKey ?? ""}`}
            className="hq-row mt-1 flex items-center gap-2 px-2.5 py-2 text-[12.5px]"
            style={{ borderRadius: "var(--radius-control)", color: "var(--color-ink-brand)" }}
          >
            {t("role.seeGuest", "See what a guest sees")}
          </a>
        </div>
      )}
    </div>
  );
}

function RoleRow({
  role,
  current,
  onPick,
}: {
  role: Role;
  current: Role;
  onPick: (r: Role) => void;
}) {
  const t = useT();
  const on = role === current;
  const caps = CAPABILITIES[role];
  const granted = Object.values(caps).filter(Boolean).length;

  return (
    <li>
      <button
        onClick={() => onPick(role)}
        aria-current={on ? "true" : undefined}
        className="hq-row flex w-full items-start gap-2.5 p-2 text-start"
        style={{ borderRadius: "var(--radius-control)", minHeight: 44 }}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t(`role.${role}`, ROLE_LABEL[role])}
            </span>
            <span className="tabular text-[11px]" style={{ color: "var(--color-ink-subtle)" }}>
              {t("role.capCount", "{n} of {total}", { n: granted, total: Object.keys(caps).length })}
            </span>
          </span>
          <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: "var(--color-ink-muted)" }}>
            {t(`role.${role}.blurb`, ROLE_BLURB[role])}
          </span>
        </span>
        {on && (
          <Check
            size={14}
            weight="bold"
            aria-hidden="true"
            style={{ color: "var(--color-ink-brand)", marginTop: 2 }}
          />
        )}
      </button>
    </li>
  );
}
