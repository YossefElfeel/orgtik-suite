"use client";

/**
 * SOMION HQ - PERSON TILE
 *
 * One person on the floor. Deliberately memoised and subscribed to its OWN
 * presence record: when Sara walks across the room, Sara's tile re-renders and
 * nothing else does. The floor is never re-rendered as a whole.
 *
 * Movement is a CSS transition on left/top rather than a JS animation loop, so
 * twelve people can walk at once without touching the main thread.
 */

import { MicrophoneSlash, SpeakerSlash } from "@phosphor-icons/react";
import { memo, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { usePresenceOf, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META } from "@/lib/presence";
import { proximityLevel } from "@/lib/audio";
import { useT } from "@/lib/i18n";

interface PersonTileProps {
  userId: string;
  isMe: boolean;
  /** The signed-in person's position, for the proximity meter. */
  listenerAt: { x: number; y: number };
  onSelect: (userId: string, anchor: { x: number; y: number }) => void;
  selected: boolean;
  /** Only your own tile can be dragged; the floor owns the drag itself. */
  onDragStart?: (e: React.MouseEvent) => void;
}

function PersonTileBase({ userId, isMe, listenerAt, onSelect, selected, onDragStart }: PersonTileProps) {
  const t = useT();
  const user = useUser(userId);
  const presence = usePresenceOf(userId);
  const idleOn = useWorkspace((s) => s.settings.idleMotion);
  const mutedForMe = useWorkspace((s) => s.localMutes.includes(userId));
  const ref = useRef<HTMLButtonElement>(null);
  const [justMoved, setJustMoved] = useState(false);
  const prev = useRef(presence?.position);

  /* A person arriving somewhere gets a brief highlight so the eye catches the
     change without an animation running forever. */
  useEffect(() => {
    if (!presence) return;
    const p = presence.position;
    const before = prev.current;
    if (before && (before.x !== p.x || before.y !== p.y)) {
      setJustMoved(true);
      const id = setTimeout(() => setJustMoved(false), 380);
      prev.current = p;
      return () => clearTimeout(id);
    }
    prev.current = p;
    return;
  }, [presence]);

  if (!user || !presence) return null;

  const meta = STATUS_META[presence.status];

  /* Phase and period come from the id, so each person breathes on their own
     cycle and the floor never bobs in unison. A stable hash, not Math.random,
     so it survives re-render. */
  const seed = Array.from(userId).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const idleDelay = -((seed % 3600) / 1000);
  const idleDuration = 3.2 + (seed % 900) / 1000;
  const level = presence.speaking ? proximityLevel(presence.position, listenerAt) : 0;

  return (
    <button
      ref={ref}
      type="button"
      className="hq-tile absolute"
      data-user={userId}
      onClick={() => onSelect(userId, presence.position)}
      onMouseDown={onDragStart}
      title={isMe ? t("office.dragHint", "Drag to move, or walk with the arrow keys") : undefined}
      aria-label={[
        user.name,
        t(`status.${presence.status}`, meta.label),
        presence.customText,
        presence.muted ? t("office.mutedByModerator", "Muted by a moderator") : null,
        presence.deafened ? t("office.deafenedByModerator", "Deafened by a moderator") : null,
        mutedForMe ? t("office.mutedForYou", "Muted for you") : null,
      ]
        .filter(Boolean)
        .join(", ")}
      aria-pressed={selected}
      style={{
        left: `${presence.position.x}%`,
        top: `${presence.position.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isMe ? 15 : selected ? 18 : 10,
        borderRadius: "var(--radius-chip)",
        cursor: isMe ? "grab" : "pointer",
      }}
    >
      <span
        className={`relative flex flex-col items-center gap-1 ${justMoved ? "hq-walk" : idleOn ? "hq-idle" : ""}`}
        style={{ animationDelay: justMoved ? "0s" : `${idleDelay}s`, animationDuration: justMoved ? undefined : `${idleDuration}s` }}
      >
        <span
          className="relative inline-flex"
          style={{
            borderRadius: "var(--radius-chip)",
            /* The signed-in person carries a brand ring so "where am I" is
               answerable at a glance without reading a single label. */
            boxShadow: isMe
              ? "0 0 0 2px var(--color-accent), 0 0 0 4px var(--color-surface)"
              : selected
                ? "0 0 0 2px var(--color-ink), 0 0 0 4px var(--color-surface)"
                : justMoved
                  ? "0 0 0 3px color-mix(in srgb, var(--color-accent) 30%, transparent)"
                  : "0 0 0 3px var(--color-surface)",
            transition: "box-shadow var(--duration-tile) var(--ease-out-soft)",
          }}
        >
          <Avatar
            name={user.name}
            initials={user.initials}
            tint={user.tint}
            status={presence.status}
            size={40}
            speaking={presence.speaking}
          />
        </span>

        {/* Name plate. Present at rest, not on hover: a floor you have to
            hover to read is a floor you cannot scan. */}
        <span
          className="pointer-events-none max-w-[92px] truncate px-1.5 py-0.5 text-[10.5px] font-medium"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-chip)",
            boxShadow: "var(--shadow-raise)",
          }}
        >
          {isMe ? t("office.youTile", "You") : <bdi>{user.name.split(" ")[0]}</bdi>}
        </span>

        {/* What has been done to their audio, by a moderator or by you. */}
        {(presence.muted || presence.deafened || mutedForMe) && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -start-1 -top-1 flex gap-0.5"
          >
            {(presence.muted || mutedForMe) && (
              <span
                className="flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "var(--radius-chip)",
                  background: "var(--color-surface)",
                  color: presence.muted ? "var(--color-danger-600)" : "var(--color-ink-muted)",
                  boxShadow: "var(--shadow-raise)",
                }}
                title={presence.muted ? t("office.mutedByModerator", "Muted by a moderator") : t("office.mutedForYou", "Muted for you")}
              >
                <MicrophoneSlash size={10} weight="bold" />
              </span>
            )}
            {presence.deafened && (
              <span
                className="flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "var(--radius-chip)",
                  background: "var(--color-surface)",
                  color: "var(--color-danger-600)",
                  boxShadow: "var(--shadow-raise)",
                }}
                title={t("office.deafenedByModerator", "Deafened by a moderator")}
              >
                <SpeakerSlash size={10} weight="bold" />
              </span>
            )}
          </span>
        )}

        {/* What has been done to their audio, by a moderator or by you. */}
        {(presence.muted || presence.deafened || mutedForMe) && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -start-1 -top-1 flex gap-0.5"
          >
            {(presence.muted || mutedForMe) && (
              <span
                className="flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "var(--radius-chip)",
                  background: "var(--color-surface)",
                  color: presence.muted ? "var(--color-danger-600)" : "var(--color-ink-muted)",
                  boxShadow: "var(--shadow-raise)",
                }}
                title={presence.muted ? t("office.mutedByModerator", "Muted by a moderator") : t("office.mutedForYou", "Muted for you")}
              >
                <MicrophoneSlash size={10} weight="bold" />
              </span>
            )}
            {presence.deafened && (
              <span
                className="flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "var(--radius-chip)",
                  background: "var(--color-surface)",
                  color: "var(--color-danger-600)",
                  boxShadow: "var(--shadow-raise)",
                }}
                title={t("office.deafenedByModerator", "Deafened by a moderator")}
              >
                <SpeakerSlash size={10} weight="bold" />
              </span>
            )}
          </span>
        )}

        {/* Proximity meter: how loud this person is from where you stand. It
            makes the Web Audio panning visible as well as audible. */}
        {level > 0.02 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1.5 flex items-end gap-[2px]"
            style={{ height: 10 }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 2.5,
                  height: `${Math.max(2, level * 10 * (i === 1 ? 1 : 0.65))}px`,
                  background: "var(--color-presence-available)",
                  borderRadius: 2,
                  transition: "height var(--duration-state) linear",
                }}
              />
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

export const PersonTile = memo(PersonTileBase);
