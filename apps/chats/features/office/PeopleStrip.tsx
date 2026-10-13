"use client";

/**
 * SOMION HQ - PEOPLE STRIP
 *
 * Everyone who is around, in one row above the floor. The floor answers "who
 * is here" spatially; this answers it as a list you can scan in a second, and
 * every face on it is a way to find that person on the floor - click, and the
 * view centres on them.
 *
 * Grouped by where they are, because "Nadia and Marc are in Room B" is the
 * unit of information, not "Nadia is online".
 */

import { roomHidesOccupants } from "@/lib/presence";
import { Avatar } from "@/components/ui/Avatar";
import { useFloor, usePresenceList } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

export function PeopleStrip() {
  const people = usePresenceList();
  const floor = useFloor();
  const me = useWorkspace((s) => s.me);
  const focusOn = useWorkspace((s) => s.focusOnPerson);
  const t = useT();

  const online = people.filter(({ presence }) => presence.status !== "offline");
  if (online.length === 0) return null;

  /* Rooms first, in floor order; then the open floor. */
  const groups = floor.rooms
    .map((room) => ({
      key: room.id,
      label: room.name,
      hidden: roomHidesOccupants(room),
      rows: online.filter(({ presence }) => presence.roomId === room.id),
    }))
    .filter((g) => g.rows.length > 0);
  const loose = online.filter(({ presence }) => !presence.roomId);
  if (loose.length > 0) groups.push({ key: "floor", label: t("office.openFloor", "Floor"), hidden: false, rows: loose });

  return (
    <div
      className="flex shrink-0 items-center gap-1 overflow-x-auto px-4 pb-2"
      role="group"
      aria-label={t("office.peopleStrip", "Everyone around")}
    >
      {groups.map((g, gi) => (
        <div
          key={g.key}
          role="group"
          aria-label={g.label}
          className={"flex shrink-0 items-center gap-1 px-1.5 py-1 "+((gi % 2?"ch-background-transparent":"ch-background-var---color-surface-sunken")+' '+"ch-border-radius-var---radius-chip")}

        >
          <span
            className={"me-0.5 max-w-[88px] truncate ps-1 text-micro font-semibold uppercase "+("ch-color-var---color-ink-subtle"+' '+"ch-letter-spacing-0-05em")}

          >
            <bdi>{g.label}</bdi>
          </span>
          {g.hidden ? (
            <span
              className={"tabular px-2 text-caption font-medium "+("ch-color-var---color-ink-muted"+' '+"ch-line-height-34px")}

              title={t("office.hiddenRoom", "This room does not name who is inside")}
            >
              {t("office.nInside", "{n} inside", { n: g.rows.length })}
            </span>
          ) : g.rows.map(({ user, presence }) => (
            <button
              key={user.id}
              type="button"
              onClick={() => focusOn(user.id)}
              className={"hq-btn flex items-center justify-center "+("ch-width-34px"+' '+"ch-height-34px"+' '+"ch-border-radius-var---radius-chip")}

              title={t("office.findPerson", "Find {name} on the floor", { name: user.name })}
              aria-label={t("office.findPerson", "Find {name} on the floor", { name: user.name })}
            >
              <span
                className={"ch-border-radius-var---radius-chip"+' '+(user.id === me?"ch-box-shadow-0-0-0-2px-var---color-accent-0-0-0-3px-var---color-surface":"ch-box-shadow-0-0-0-2px-var---color-surface")+' '+"ch-display-inline-flex"}
              >
                <Avatar
                  name={user.name}
                  initials={user.initials}
                  tint={user.tint}
                  status={presence.status}
                  size={28}
                  speaking={presence.speaking}
                />
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
