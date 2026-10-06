"use client";

/**
 * SOMION HQ - ROOM FURNITURE
 *
 * Dimensional objects, not flat rectangles. Every piece is built the same way,
 * which is what makes a floor of them look designed rather than assembled:
 *
 *     contact shadow   the object sits ON the floor rather than in it
 *     side face        a darker extrusion, offset down by the piece's depth
 *     top face         a soft gradient lit from the upper left
 *     top light        a 1px inner highlight along the leading edge
 *
 * One light direction for the whole floor. That single consistency is most of
 * the difference between crafted and clip art.
 *
 * Three rules hold this to the design system:
 *
 *   1. THE PERSON OUTRANKS THE FURNITURE. Materials stay above muted ink in
 *      value; a person carries a white ring, a saturated presence lamp and a
 *      name plate, so they win the depth contest from every direction.
 *   2. NO NEW SATURATION. Presence owns colour. The only hue here is a
 *      desaturated sage for foliage, 87 degrees from the available teal.
 *   3. NO ASSET PIPELINE. Everything is token-coloured CSS, so it restyles
 *      with the brand and there is nothing to redraw.
 *
 * The whole layer is `aria-hidden` and `pointer-events: none`: it never enters
 * the accessibility tree, never intercepts a click meant for the room, and
 * never adds a tab stop. A screen reader hears "Meeting room, 8 seats" from
 * the room button, which is the information.
 */

import { memo } from "react";
import { PIECE_SIZE, furnitureFor, type Piece, type PieceKind } from "@/lib/furniture";

/* ------------------------------------------------------------- materials */

interface Material {
  top: string;
  mid: string;
  side: string;
}

const OAK: Material = { top: "var(--mat-oak-top)", mid: "var(--mat-oak)", side: "var(--mat-oak-side)" };
const SOFT: Material = { top: "var(--mat-soft-top)", mid: "var(--mat-soft)", side: "var(--mat-soft-side)" };
const METAL: Material = { top: "var(--mat-metal-top)", mid: "var(--mat-metal)", side: "var(--mat-metal-side)" };
const GLASS: Material = { top: "var(--mat-glass-top)", mid: "var(--mat-glass)", side: "var(--mat-glass-side)" };
const LEAF: Material = { top: "var(--mat-leaf-top)", mid: "var(--mat-leaf)", side: "var(--mat-leaf-side)" };
const POT: Material = { top: "var(--mat-pot-top)", mid: "var(--mat-pot)", side: "var(--mat-pot-side)" };

/** How tall each object stands. Drives the extrusion and the contact shadow. */
const DEPTH: Record<PieceKind, number> = {
  desk: 7,
  chair: 5,
  "table-round": 8,
  "table-oval": 8,
  stool: 7,
  sofa: 10,
  plant: 6,
  cooler: 11,
  coffee: 8,
  shelf: 13,
  screen: 3,
  rug: 0,
  door: 0,
  "window-h": 0,
  "window-v": 0,
  "prayer-rug": 0,
  mihrab: 9,
  "shoe-rack": 7,
  "book-shelf-low": 9,
  monitor: 6,
  whiteboard: 4,
  printer: 12,
  lamp: 9,
  bin: 8,
  bench: 6,
  mic: 9,
};

/**
 * The extrusion primitive: a side face offset down by `depth`, a top face over
 * it carrying the light, and a contact shadow underneath.
 */
function Solid({
  w,
  h,
  depth,
  radius,
  material,
  children,
}: {
  w: number;
  h: number;
  depth: number;
  radius: string;
  material: Material;
  children?: React.ReactNode;
}) {
  return (
    <span style={{ position: "relative", display: "block", width: w, height: h + depth }}>
      {/* contact shadow: tight and low, so the object reads as resting */}
      <span
        style={{
          position: "absolute",
          left: 2,
          right: 2,
          top: depth + h - 5,
          height: 8,
          borderRadius: "50%",
          background: "rgb(var(--shadow-ink) / 0.13)",
          filter: "blur(4px)",
        }}
      />
      {/* side face */}
      <span
        style={{
          position: "absolute",
          insetInline: 0,
          top: depth,
          height: h,
          background: material.side,
          borderRadius: radius,
        }}
      />
      {/* top face, lit from the upper left */}
      <span
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: h,
          background: `linear-gradient(150deg, ${material.top} 0%, ${material.mid} 78%)`,
          borderRadius: radius,
          boxShadow: "var(--shadow-lit)",
        }}
      >
        {children}
      </span>
    </span>
  );
}

/** Flat inlays: rugs, doorways, glazing. These lie in the floor, not on it. */
function Flat({
  w,
  h,
  radius,
  background,
  shadow,
}: {
  w: number;
  h: number;
  radius: string;
  background: string;
  shadow?: string;
}) {
  return (
    <span
      style={{ display: "block", width: w, height: h, background, borderRadius: radius, boxShadow: shadow }}
    />
  );
}

/** One shaded sphere of foliage. */
function Leaf({ x, y, size, tone }: { x: number; y: number; size: number; tone: string }) {
  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 34% 30%, var(--mat-leaf-top), ${tone} 72%)`,
      }}
    />
  );
}

function Shape({ kind }: { kind: PieceKind }) {
  const { w, h } = PIECE_SIZE[kind];
  const d = DEPTH[kind];

  switch (kind) {
    case "desk":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object)" material={OAK}>
          {/* a monitor and a notebook, so a desk reads as a workstation */}
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 3,
              transform: "translateX(-50%)",
              width: w * 0.44,
              height: 4,
              background: "var(--mat-metal-side)",
              borderRadius: "var(--radius-object-xs)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 6,
              bottom: 4,
              width: 13,
              height: 9,
              background: "var(--mat-metal-top)",
              border: "1px solid var(--mat-metal-side)",
              borderRadius: "var(--radius-object-xs)",
            }}
          />
        </Solid>
      );

    case "chair":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h + d + 4 }}>
          {/* the back, a low bar behind the seat */}
          <span
            style={{
              position: "absolute",
              left: 1,
              right: 1,
              top: 0,
              height: 5,
              background: SOFT.side,
              borderRadius: "var(--radius-object-sm)",
            }}
          />
          <span style={{ position: "absolute", insetInline: 0, top: 3 }}>
            <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={SOFT} />
          </span>
        </span>
      );

    case "stool":
      return <Solid w={w} h={h} depth={d} radius="50%" material={SOFT} />;

    case "table-round":
      return <Solid w={w} h={h} depth={d} radius="50%" material={OAK} />;

    case "table-oval":
      return <Solid w={w} h={h} depth={d} radius="999px" material={OAK} />;

    case "sofa":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h + d + 6 }}>
          <span
            style={{
              position: "absolute",
              insetInline: 0,
              top: 0,
              height: 9,
              background: SOFT.side,
              borderRadius: "var(--radius-object-lg) var(--radius-object-lg) 0 0",
            }}
          />
          <span style={{ position: "absolute", insetInline: 0, top: 5 }}>
            <Solid w={w} h={h} depth={d} radius="var(--radius-object-lg)" material={SOFT}>
              <span
                style={{
                  position: "absolute",
                  left: 5,
                  top: 4,
                  width: w / 2 - 8,
                  height: h - 8,
                  background: SOFT.top,
                  borderRadius: "var(--radius-object-sm)",
                  opacity: 0.8,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 5,
                  top: 4,
                  width: w / 2 - 8,
                  height: h - 8,
                  background: SOFT.top,
                  borderRadius: "var(--radius-object-sm)",
                  opacity: 0.8,
                }}
              />
            </Solid>
          </span>
        </span>
      );

    case "plant":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h }}>
          <span style={{ position: "absolute", left: (w - 20) / 2, bottom: 0 }}>
            <Solid
              w={20}
              h={11}
              depth={6}
              radius="var(--radius-object-xs) var(--radius-object-xs) var(--radius-object-lg) var(--radius-object-lg)"
              material={POT}
            />
          </span>
          <Leaf x={0} y={9} size={17} tone={LEAF.side} />
          <Leaf x={w - 16} y={11} size={16} tone={LEAF.mid} />
          <Leaf x={(w - 19) / 2} y={0} size={19} tone={LEAF.top} />
        </span>
      );

    case "cooler":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h }}>
          <span style={{ position: "absolute", insetInline: 0, bottom: 0 }}>
            <Solid w={w} h={20} depth={d} radius="var(--radius-object-sm)" material={METAL} />
          </span>
          {/* the bottle: glass, so it reads as water */}
          <span style={{ position: "absolute", left: 3, top: 0 }}>
            <Solid
              w={w - 6}
              h={15}
              depth={4}
              radius="var(--radius-object-lg) var(--radius-object-lg) var(--radius-object-xs) var(--radius-object-xs)"
              material={GLASS}
            />
          </span>
        </span>
      );

    case "coffee":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={METAL}>
          <span
            style={{
              position: "absolute",
              insetInline: 6,
              bottom: 4,
              height: 7,
              background: "var(--color-paper-800)",
              borderRadius: "var(--radius-object-xs)",
              opacity: 0.5,
            }}
          />
        </Solid>
      );

    case "shelf":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* books: alternating warm tones, low chroma */}
          <span
            style={{
              position: "absolute",
              inset: "5px 3px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  background: i % 2 ? "var(--mat-pot)" : "var(--mat-metal)",
                  borderRadius: "var(--radius-object-xs)",
                  opacity: 0.75,
                }}
              />
            ))}
          </span>
        </Solid>
      );

    case "screen":
    case "monitor":
      return <Solid w={w} h={h} depth={d} radius="var(--radius-object-xs)" material={METAL} />;

    case "whiteboard":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-xs)" material={GLASS} />
      );

    case "printer":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={METAL}>
          <span
            style={{
              position: "absolute",
              insetInline: 5,
              top: 5,
              height: 5,
              background: "var(--mat-metal-side)",
              borderRadius: "var(--radius-object-xs)",
            }}
          />
          {/* the output tray */}
          <span
            style={{
              position: "absolute",
              insetInline: 7,
              bottom: 4,
              height: 6,
              background: "var(--color-paper-0)",
              borderRadius: "var(--radius-object-xs)",
            }}
          />
        </Solid>
      );

    case "bin":
      return <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />;

    case "bench":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* slats */}
          <span style={{ position: "absolute", inset: "3px 4px", display: "flex", flexDirection: "column", gap: 2 }}>
            {[0, 1].map((i) => (
              <span key={i} style={{ flex: 1, background: "var(--mat-oak-side)", borderRadius: 1, opacity: 0.35 }} />
            ))}
          </span>
        </Solid>
      );

    case "mic":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h + 8 }}>
          {/* the stand */}
          <span
            style={{
              position: "absolute",
              left: w / 2 - 1,
              top: 4,
              width: 2,
              height: h,
              background: "var(--mat-metal-side)",
              borderRadius: 1,
            }}
          />
          <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />
        </span>
      );

    case "lamp":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h + 8 }}>
          {/* the pool of light it casts, which is the point of drawing a lamp */}
          <span
            style={{
              position: "absolute",
              left: -10,
              top: -6,
              width: w + 20,
              height: h + 20,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgb(255 246 214 / 0.55), transparent 70%)",
            }}
          />
          <Solid w={w} h={h} depth={8} radius="50%" material={POT} />
        </span>
      );

    /* ---- prayer room ---- */

    /* The mihrab: the niche marking the qibla. It is drawn as an arch set into
       the wall, and every rug in the room is laid facing it. */
    case "mihrab":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h + d }}>
          <span
            style={{
              position: "absolute",
              insetInline: 0,
              top: d,
              height: h,
              background: "var(--mat-oak-side)",
              borderRadius: `${h}px ${h}px var(--radius-object-xs) var(--radius-object-xs)`,
            }}
          />
          <span
            style={{
              position: "absolute",
              insetInline: 0,
              top: 0,
              height: h,
              background: `linear-gradient(150deg, var(--mat-oak-top), var(--mat-oak) 78%)`,
              borderRadius: `${h}px ${h}px var(--radius-object-xs) var(--radius-object-xs)`,
              boxShadow: "var(--shadow-lit)",
            }}
          />
          {/* the recess itself, darker because it is a niche */}
          <span
            style={{
              position: "absolute",
              left: w * 0.28,
              top: 3,
              width: w * 0.44,
              height: h - 3,
              background: "var(--mat-oak-side)",
              borderRadius: `${h}px ${h}px 0 0`,
              opacity: 0.75,
            }}
          />
        </span>
      );

    /* A rug lies in the floor rather than standing on it, so it takes the flat
       primitive: no extrusion, no contact shadow. */
    case "prayer-rug":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h }}>
          <Flat
            w={w}
            h={h}
            radius="var(--radius-object)"
            background="linear-gradient(160deg, var(--mat-soft-top), var(--mat-soft) 80%)"
            shadow="inset 0 0 0 1px var(--mat-soft-side)"
          />
          {/* The woven arch at the head of the rug, which points to the qibla.
              It is why a prayer rug is recognisable at this size at all. */}
          <span
            style={{
              position: "absolute",
              left: w * 0.26,
              top: 5,
              width: w * 0.48,
              height: h * 0.3,
              borderRadius: `${w * 0.24}px ${w * 0.24}px 2px 2px`,
              border: "1.5px solid var(--mat-pot-side)",
              opacity: 0.55,
            }}
          />
          <span
            style={{
              position: "absolute",
              insetInline: 5,
              bottom: 5,
              height: 2,
              background: "var(--mat-pot-side)",
              borderRadius: 1,
              opacity: 0.4,
            }}
          />
        </span>
      );

    case "shoe-rack":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span style={{ position: "absolute", inset: "4px 4px", display: "flex", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  background: "var(--mat-oak-side)",
                  borderRadius: "var(--radius-object-xs)",
                  opacity: 0.5,
                }}
              />
            ))}
          </span>
        </Solid>
      );

    case "book-shelf-low":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span style={{ position: "absolute", inset: "4px 5px", display: "flex", gap: 2 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  background: i % 2 ? "var(--mat-pot)" : "var(--mat-metal)",
                  borderRadius: "var(--radius-object-xs)",
                  opacity: 0.7,
                }}
              />
            ))}
          </span>
        </Solid>
      );

    case "rug":
      return <Flat w={w} h={h} radius="var(--radius-card)" background="var(--color-paper-100)" />;

    /* A doorway: a gap of floor cut into the wall, with a swing arc. */
    case "door":
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h }}>
          <Flat w={w} h={h} radius="var(--radius-object-sm)" background="var(--color-floor)" />
          <span
            style={{
              position: "absolute",
              left: 2,
              top: 0,
              width: 22,
              height: 22,
              borderInlineStart: "1px solid var(--color-paper-400)",
              borderBottom: "1px solid var(--color-paper-400)",
              borderEndStartRadius: 22,
              opacity: 0.55,
            }}
          />
        </span>
      );

    /* Glazing: daylight, so it spills a pool of light onto the floor inside.
       The pool is what makes a window a window rather than a pale bar. */
    case "window-h":
    case "window-v": {
      const horizontal = kind === "window-h";
      return (
        <span style={{ position: "relative", display: "block", width: w, height: h }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: horizontal ? -14 : 0,
              top: horizontal ? 0 : -14,
              width: horizontal ? w + 28 : 64,
              height: horizontal ? 64 : h + 28,
              background: horizontal
                ? "radial-gradient(ellipse at 50% 0%, var(--light-window), transparent 70%)"
                : "radial-gradient(ellipse at 0% 50%, var(--light-window), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <Flat
            w={w}
            h={h}
            radius="var(--radius-object-sm)"
            background={`linear-gradient(${horizontal ? "180deg" : "90deg"}, var(--mat-glass-top), var(--mat-glass))`}
            shadow="0 0 10px 2px rgb(232 240 242 / 0.8)"
          />
        </span>
      );
    }

    default:
      return null;
  }
}

function RoomFurnitureBase({ roomId, kind }: { roomId: string; kind: string }) {
  const pieces = furnitureFor({ id: roomId, kind });
  if (!pieces?.length) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ borderRadius: "var(--radius-room)" }}
    >
      {pieces.map((piece: Piece, i: number) => (
        <span
          key={`${piece.kind}-${i}`}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            transform: `translate(-50%, -50%) rotate(${piece.rot ?? 0}deg) scale(${piece.scale ?? 1})`,
            lineHeight: 0,
          }}
        >
          <Shape kind={piece.kind} />
        </span>
      ))}
    </span>
  );
}

/** Static per room, so it never re-renders while people move around it. */
export const RoomFurniture = memo(RoomFurnitureBase);
