"use client";
import {geometryClass} from "@/lib/geometry";

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
    <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + depth}))} >
      {/* contact shadow: tight and low, so the object reads as resting */}
      <span
        className={("ch-position-absolute"+' '+"ch-inset-inline-start-2px"+' '+"ch-inset-inline-end-2px"+' '+"ch-height-8px"+' '+"ch-border-radius-50pct"+' '+"ch-background-rgb-var---shadow-ink-0-13"+' '+"ch-filter-blur-4px")+" "+(geometryClass({top:depth + h - 5}))}
      />
      {/* side face */}
      <span
        className={("ch-position-absolute"+' '+"ch-inset-inline-0")+" "+(materialClass(material,'side')+' '+furnitureRadius(radius)+' '+geometryClass({top:depth,height:h}))}
      />
      {/* top face, lit from the upper left */}
      <span
        className={("ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-top-0"+' '+"ch-box-shadow-var---shadow-lit")+" "+(materialClass(material,'top')+' '+furnitureRadius(radius)+' '+geometryClass({height:h}))}
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
      className={("ch-display-block")+" "+(flatPaint(background)+' '+furnitureRadius(radius)+' '+(shadow?'ch-furniture-inlay-shadow':'')+' '+geometryClass({width:w,height:h}))}
    />
  );
}

/** One shaded sphere of foliage. */
function Leaf({ x, y, size, tone }: { x: number; y: number; size: number; tone: string }) {
  return (
    <span
      className={("ch-position-absolute"+' '+"ch-border-radius-50pct")+" "+('ch-leaf'+' '+geometryClass({left:x,top:y,width:size,height:size}))}
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
            className={("ch-position-absolute"+' '+"ch-inset-inline-start-50pct"+' '+"ch-top-3px"+' '+"ch-transform-translateX--50pct"+' '+"ch-height-4px"+' '+"ch-background-var---mat-metal-side"+' '+"ch-border-radius-var---radius-object-xs")+" "+(geometryClass({width:w * 0.44}))}
          />
          <span
            className={"ch-position-absolute"+' '+"ch-inset-inline-end-6px"+' '+"ch-bottom-4px"+' '+"ch-width-13px"+' '+"ch-height-9px"+' '+"ch-background-var---mat-metal-top"+' '+"ch-border-1px-solid-var---mat-metal-side"+' '+"ch-border-radius-var---radius-object-xs"}
          />
        </Solid>
      );

    case "chair":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + d + 4}))} >
          {/* the back, a low bar behind the seat */}
          <span
            className={("ch-position-absolute"+' '+"ch-inset-inline-start-1px"+' '+"ch-inset-inline-end-1px"+' '+"ch-top-0"+' '+"ch-height-5px"+' '+"ch-border-radius-var---radius-object-sm")+" "+('ch-material-soft-side')}
          />
          <span className={"ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-top-3px"} >
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
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + d + 6}))} >
          <span
            className={("ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-top-0"+' '+"ch-height-9px"+' '+"ch-border-radius-var---radius-object-lg-var---radius-object-lg-0-0")+" "+('ch-material-soft-side')}
          />
          <span className={"ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-top-5px"} >
            <Solid w={w} h={h} depth={d} radius="var(--radius-object-lg)" material={SOFT}>
              <span
                className={("ch-position-absolute"+' '+"ch-inset-inline-start-5px"+' '+"ch-top-4px"+' '+"ch-border-radius-var---radius-object-sm"+' '+"ch-opacity-0-8")+" "+('ch-material-soft-top'+' '+geometryClass({width:w / 2 - 8,height:h - 8}))}
              />
              <span
                className={("ch-position-absolute"+' '+"ch-inset-inline-end-5px"+' '+"ch-top-4px"+' '+"ch-border-radius-var---radius-object-sm"+' '+"ch-opacity-0-8")+" "+('ch-material-soft-top'+' '+geometryClass({width:w / 2 - 8,height:h - 8}))}
              />
            </Solid>
          </span>
        </span>
      );

    case "plant":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h}))} >
          <span className={("ch-position-absolute"+' '+"ch-bottom-0")+" "+(geometryClass({left:(w - 20) / 2}))} >
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
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h}))} >
          <span className={"ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-bottom-0"} >
            <Solid w={w} h={20} depth={d} radius="var(--radius-object-sm)" material={METAL} />
          </span>
          {/* the bottle: glass, so it reads as water */}
          <span className={"ch-position-absolute"+' '+"ch-inset-inline-start-3px"+' '+"ch-top-0"} >
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
            className={"ch-position-absolute"+' '+"ch-inset-inline-6px"+' '+"ch-bottom-4px"+' '+"ch-height-7px"+' '+"ch-background-var---color-paper-800"+' '+"ch-border-radius-var---radius-object-xs"+' '+"ch-opacity-0-5"}
          />
        </Solid>
      );

    case "shelf":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* books: alternating warm tones, low chroma */}
          <span
            className={"ch-position-absolute"+' '+"ch-inset-5px-3px"+' '+"ch-display-flex"+' '+"ch-flex-direction-column"+' '+"ch-gap-4px"}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={"ch-flex-1"+' '+(i % 2?"ch-background-var---mat-pot":"ch-background-var---mat-metal")+' '+"ch-border-radius-var---radius-object-xs"+' '+"ch-opacity-0-75"}
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
            className={"ch-position-absolute"+' '+"ch-inset-inline-5px"+' '+"ch-top-5px"+' '+"ch-height-5px"+' '+"ch-background-var---mat-metal-side"+' '+"ch-border-radius-var---radius-object-xs"}
          />
          {/* the output tray */}
          <span
            className={"ch-position-absolute"+' '+"ch-inset-inline-7px"+' '+"ch-bottom-4px"+' '+"ch-height-6px"+' '+"ch-background-var---color-paper-0"+' '+"ch-border-radius-var---radius-object-xs"}
          />
        </Solid>
      );

    case "bin":
      return <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />;

    case "bench":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* slats */}
          <span className={"ch-position-absolute"+' '+"ch-inset-3px-4px"+' '+"ch-display-flex"+' '+"ch-flex-direction-column"+' '+"ch-gap-2px"} >
            {[0, 1].map((i) => (
              <span key={i} className={"ch-flex-1"+' '+"ch-background-var---mat-oak-side"+' '+"ch-border-radius-var---ot-radius-field"+' '+"ch-opacity-0-35"}  />
            ))}
          </span>
        </Solid>
      );

    case "mic":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + 8}))} >
          {/* the stand */}
          <span
            className={("ch-position-absolute"+' '+"ch-top-4px"+' '+"ch-width-2px"+' '+"ch-background-var---mat-metal-side"+' '+"ch-border-radius-var---ot-radius-field")+" "+(geometryClass({left:w / 2 - 1,height:h}))}
          />
          <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />
        </span>
      );

    case "lamp":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + 8}))} >
          {/* the pool of light it casts, which is the point of drawing a lamp */}
          <span
            className={("ch-position-absolute"+' '+"ch-inset-inline-start-10px"+' '+"ch-top-6px"+' '+"ch-border-radius-50pct"+' '+"ch-background-radial-gradient-circle-rgb-255-246-214-0-55-transparent-70pct")+" "+(geometryClass({width:w + 20,height:h + 20}))}
          />
          <Solid w={w} h={h} depth={8} radius="50%" material={POT} />
        </span>
      );

    /* ---- prayer room ---- */

    /* The mihrab: the niche marking the qibla. It is drawn as an arch set into
       the wall, and every rug in the room is laid facing it. */
    case "mihrab":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h + d}))} >
          <span
            className={("ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-background-var---mat-oak-side")+" "+('ch-furniture-arch'+' '+geometryClass({top:d,height:h}))}
          />
          <span
            className={("ch-position-absolute"+' '+"ch-inset-inline-0"+' '+"ch-top-0"+' '+"ch-background-linear-gradient-150deg-var---mat-oak-top-var---mat-oak-78pct"+' '+"ch-box-shadow-var---shadow-lit")+" "+('ch-furniture-arch'+' '+geometryClass({height:h}))}
          />
          {/* the recess itself, darker because it is a niche */}
          <span
            className={("ch-position-absolute"+' '+"ch-top-3px"+' '+"ch-background-var---mat-oak-side"+' '+"ch-opacity-0-75")+" "+('ch-furniture-arch'+' '+geometryClass({left:w * 0.28,width:w * 0.44,height:h - 3}))}
          />
        </span>
      );

    /* A rug lies in the floor rather than standing on it, so it takes the flat
       primitive: no extrusion, no contact shadow. */
    case "prayer-rug":
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h}))} >
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
            className={("ch-position-absolute"+' '+"ch-top-5px"+' '+"ch-border-1-5px-solid-var---mat-pot-side"+' '+"ch-opacity-0-55")+" "+('ch-furniture-arch'+' '+geometryClass({left:w * 0.26,width:w * 0.48,height:h * 0.3}))}
          />
          <span
            className={"ch-position-absolute"+' '+"ch-inset-inline-5px"+' '+"ch-bottom-5px"+' '+"ch-height-2px"+' '+"ch-background-var---mat-pot-side"+' '+"ch-border-radius-var---ot-radius-field"+' '+"ch-opacity-0-4"}
          />
        </span>
      );

    case "shoe-rack":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span className={"ch-position-absolute"+' '+"ch-inset-4px-4px"+' '+"ch-display-flex"+' '+"ch-gap-3px"} >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={"ch-flex-1"+' '+"ch-background-var---mat-oak-side"+' '+"ch-border-radius-var---radius-object-xs"+' '+"ch-opacity-0-5"}
              />
            ))}
          </span>
        </Solid>
      );

    case "book-shelf-low":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span className={"ch-position-absolute"+' '+"ch-inset-4px-5px"+' '+"ch-display-flex"+' '+"ch-gap-2px"} >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={"ch-flex-1"+' '+(i % 2?"ch-background-var---mat-pot":"ch-background-var---mat-metal")+' '+"ch-border-radius-var---radius-object-xs"+' '+"ch-opacity-0-7"}
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
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h}))} >
          <Flat w={w} h={h} radius="var(--radius-object-sm)" background="var(--color-floor)" />
          <span
            className={"ch-position-absolute"+' '+"ch-inset-inline-start-2px"+' '+"ch-top-0"+' '+"ch-width-22px"+' '+"ch-height-22px"+' '+"ch-border-inline-start-1px-solid-var---color-paper-400"+' '+"ch-border-bottom-1px-solid-var---color-paper-400"+' '+"ch-border-end-start-radius-22px"+' '+"ch-opacity-0-55"}
          />
        </span>
      );

    /* Glazing: daylight, so it spills a pool of light onto the floor inside.
       The pool is what makes a window a window rather than a pale bar. */
    case "window-h":
    case "window-v": {
      const horizontal = kind === "window-h";
      return (
        <span className={("ch-position-relative"+' '+"ch-display-block")+" "+(geometryClass({width:w,height:h}))} >
          <span
            aria-hidden="true"
            className={("ch-position-absolute"+' '+(horizontal?"ch-inset-inline-start-14px":"ch-inset-inline-start-0")+' '+(horizontal?"ch-top-0":"ch-top-14px")+' '+(horizontal?"ch-background-radial-gradient-ellipse-at-50pct-0pct-var---light-window-transparent-70pct":"ch-background-radial-gradient-ellipse-at-0pct-50pct-var---light-window-transparent-70pct")+' '+"ch-pointer-events-none")+" "+(geometryClass({width:horizontal ? w + 28 : 64,height:horizontal ? 64 : h + 28}))}
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
      className={"pointer-events-none absolute inset-0 overflow-hidden "+("ch-border-radius-var---radius-room")}

    >
      {pieces.map((piece: Piece, i: number) => (
        <span
          key={`${piece.kind}-${i}`}
          className={("absolute "+("ch-line-height-0"))+" "+(geometryClass({left:`${piece.x}%`,top:`${piece.y}%`,transform:`translate(-50%, -50%) rotate(${piece.rot ?? 0}deg) scale(${piece.scale ?? 1})`}))}

        >
          <Shape kind={piece.kind} />
        </span>
      ))}
    </span>
  );
}

/** Static per room, so it never re-renders while people move around it. */
export const RoomFurniture = memo(RoomFurnitureBase);

function materialClass(material:Material,face:'top'|'side'){const key=material.mid.includes('soft')?'soft':material.mid.includes('metal')?'metal':material.mid.includes('glass')?'glass':material.mid.includes('leaf')?'leaf':material.mid.includes('pot')?'pot':'oak';return 'ch-material-'+key+'-'+face;}function furnitureRadius(radius:string){return radius==='50%'||radius==='999px'?'ch-furniture-round':radius.includes(' ')?'ch-furniture-arch':'ch-furniture-radius';}function flatPaint(value:string){return value.includes('glass')?'ch-flat-glass':value.includes('soft')?'ch-flat-soft':value.includes('floor')?'ch-flat-floor':'ch-flat-paper';}
