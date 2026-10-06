"use client";

/**
 * SOMION HQ - AVATAR + PRESENCE MARK
 *
 * The atomic unit of presence across the whole suite. This component is the one
 * the design plan says ships to the shared design system so the same dot can
 * appear on an assignee in Task Manager and a contact in the CRM.
 *
 * Sizes 20 / 28 / 40 / 56 as specified. Six states, each with its own MARK
 * SHAPE as well as its own hue, so status never depends on colour alone.
 */

import { memo } from "react";
import type { Status } from "@/entities";
import { STATUS_META, tintFor } from "@/lib/presence";
import { useT } from "@/lib/i18n";

export type AvatarSize = 20 | 28 | 40 | 56;

interface AvatarProps {
  name: string;
  initials: string;
  tint: number;
  status?: Status;
  size?: AvatarSize;
  /** Draws the concentric speaking ring. Only true while audio is flowing. */
  speaking?: boolean;
  /** Guests get a dashed outline so they are never mistaken for colleagues. */
  guest?: boolean;
  /** Hides the presence mark - used inside lists that show status as text. */
  hideStatus?: boolean;
  className?: string;
}

const MARK_SIZE: Record<AvatarSize, number> = { 20: 7, 28: 9, 40: 12, 56: 16 };
const FONT_SIZE: Record<AvatarSize, string> = {
  20: "9px",
  28: "11px",
  40: "14px",
  56: "19px",
};

/**
 * The six marks. Drawn rather than imported because no icon library ships a
 * presence vocabulary, and these are data marks, not decorative icons.
 * Every shape is legible at 7px, which is the real constraint.
 */
export function PresenceMark({ status, px }: { status: Status; px: number }) {
  const meta = STATUS_META[status];
  const c = meta.color;
  const half = px / 2;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* A ground disc so the mark reads on any surface it lands on. */}
      <circle cx="8" cy="8" r="8" fill="var(--color-surface)" />
      {meta.mark === "solid" && <circle cx="8" cy="8" r="5.5" fill={c} />}

      {meta.mark === "ring" && (
        <circle cx="8" cy="8" r="4.2" fill="none" stroke={c} strokeWidth="2.6" />
      )}

      {meta.mark === "dot-in-ring" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <circle cx="8" cy="8" r="2.2" fill={c} />
        </>
      )}

      {meta.mark === "half" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <path d="M8 2.5 A5.5 5.5 0 0 1 8 13.5 Z" fill={c} />
        </>
      )}

      {meta.mark === "slash" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <path d="M4.6 11.4 L11.4 4.6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {/* Offline is hollow. A pale fill could never reach 3:1, so absence is
          drawn as an empty outline instead of a faint colour. */}
      {meta.mark === "hollow" && (
        <circle cx="8" cy="8" r="5" fill="none" stroke={c} strokeWidth="1.5" />
      )}
      {half > 0 && null}
    </svg>
  );
}

function AvatarBase({
  name,
  initials,
  tint,
  status,
  size = 40,
  speaking = false,
  guest = false,
  hideStatus = false,
  className = "",
}: AvatarProps) {
  const t = tintFor(tint);
  const markPx = MARK_SIZE[size];
  const meta = status ? STATUS_META[status] : null;
  const dimmed = status === "offline";
  const tr = useT();
  const named = meta ? `${name} - ${tr(`status.${meta.id}`, meta.label)}` : name;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        /* Lit from the same upper-left direction as the furniture, so a person
           belongs to the same world as the room they stand in - and carries a
           little more light than anything around them. */
        background: `radial-gradient(circle at 32% 26%, color-mix(in srgb, ${t.bg} 55%, #fff), ${t.bg} 78%)`,
        color: t.fg,
        fontSize: FONT_SIZE[size],
        fontWeight: 600,
        letterSpacing: "0.01em",
        opacity: dimmed ? 0.55 : 1,
        border: guest ? "1.5px dashed var(--color-hairline-strong)" : "none",
        boxShadow: dimmed
          ? "none"
          : "var(--shadow-lit), 0 1px 2px rgb(var(--shadow-ink) / 0.12)",
        transition: "opacity var(--duration-state) var(--ease-out-soft)",
      }}
      /* The accessible name carries the status in words, because the mark is
         decorative to a screen reader. */
      role="img"
      aria-label={named}
      title={named}
    >
      <span aria-hidden="true">{initials}</span>

      {/* Speaking is a concentric ring, animated only while audio flows. It is
          outside the avatar so it never obscures the initials. */}
      {speaking && (
        <span
          aria-hidden="true"
          className="hq-speak pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 0 2px var(--color-presence-available), 0 0 0 5px color-mix(in srgb, var(--color-presence-available) 22%, transparent)`,
          }}
        />
      )}

      {status && !hideStatus && (
        <span
          className="absolute"
          style={{ insetInlineEnd: -1, bottom: -1, lineHeight: 0 }}
          aria-hidden="true"
        >
          <PresenceMark status={status} px={markPx} />
        </span>
      )}
    </span>
  );
}

/**
 * Memoised: on the floor, twelve of these are mounted at once and only the one
 * whose person moved should re-render.
 */
export const Avatar = memo(AvatarBase);

/* ---------------------------------------------------------------- stacked */

/** Overlapping avatars for room occupancy and thread reply summaries. */
export function AvatarStack({
  people,
  size = 20,
  max = 4,
}: {
  people: { name: string; initials: string; tint: number }[];
  size?: AvatarSize;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <span
          key={p.name}
          style={{
            marginInlineStart: i === 0 ? 0 : -Math.round(size * 0.3),
            zIndex: shown.length - i,
            borderRadius: "999px",
            boxShadow: "0 0 0 2px var(--color-surface)",
            display: "inline-flex",
          }}
        >
          <Avatar name={p.name} initials={p.initials} tint={p.tint} size={size} hideStatus />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="tabular ms-1 text-[11px]"
          style={{ color: "var(--color-ink-muted)" }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
