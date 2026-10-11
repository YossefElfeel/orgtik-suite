"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - MINIMAP
 *
 * Shown only while zoomed in, because that is the only time you can be looking
 * at part of the floor and wondering where the rest went. Rooms as shapes,
 * people as dots, you in the accent, and the rectangle of what you can see.
 * Click anywhere on it to look there.
 */

import { useT } from "@/lib/i18n";

interface Props {
  rooms: { id: string; rect: { x: number; y: number; w: number; h: number }; kind: string }[];
  people: { id: string; x: number; y: number; isMe: boolean }[];
  /** The fraction of the floor currently visible, and where its centre sits. */
  viewport: { cx: number; cy: number; fw: number; fh: number };
  aspect: number;
  onJump: (fx: number, fy: number) => void;
}

export function Minimap({ rooms, people, viewport, aspect, onJump }: Props) {
  const t = useT();
  const W = 156;
  const H = Math.round(W / Math.max(0.5, aspect));

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onJump((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      }}
      aria-label={t("office.minimap", "Map of the whole floor. Click to look there.")}
      className={("hq-floating relative block overflow-hidden "+("ch-width-8b0acd"+' '+"ch-border-radius-332348"+' '+"ch-cursor-840b5e"+' '+"ch-padding-41d7d7"))+" "+(geometryClass({height:H}))}

    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width={W} height={H} aria-hidden="true" className={"ch-display-2a1b75"} >
        <rect x="0" y="0" width="100" height="100" fill="var(--color-floor)" />
        {rooms.map((r) => (
          <rect
            key={r.id}
            x={r.rect.x}
            y={r.rect.y}
            width={r.rect.w}
            height={r.rect.h}
            rx="3"
            fill={r.kind === "desk" ? "var(--color-floor-desk)" : "var(--color-floor-room)"}
            stroke="var(--color-wall)"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {people.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.isMe ? 2.4 : 1.8}
            fill={p.isMe ? "var(--color-accent)" : "var(--color-paper-700)"}
            stroke="var(--color-surface)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <rect
          x={(viewport.cx - viewport.fw / 2) * 100}
          y={(viewport.cy - viewport.fh / 2) * 100}
          width={viewport.fw * 100}
          height={viewport.fh * 100}
          fill="rgb(255 255 255 / 0.18)"
          stroke="var(--color-ink)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          rx="1"
        />
      </svg>
    </button>
  );
}
