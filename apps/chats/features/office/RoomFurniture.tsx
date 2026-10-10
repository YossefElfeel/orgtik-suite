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
    <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + depth}))} >
      {/* contact shadow: tight and low, so the object reads as resting */}
      <span
        className={("ch-position-bb6a43"+' '+"ch-left-261659"+' '+"ch-right-3748d4"+' '+"ch-height-83ca52"+' '+"ch-border-radius-9eaa9c"+' '+"ch-background-43fd7b"+' '+"ch-filter-e0c7b4")+" "+(geometryClass({top:depth + h - 5}))} 
      />
      {/* side face */}
      <span
        className={("ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa")+" "+(materialClass(material,'side')+' '+furnitureRadius(radius)+' '+geometryClass({top:depth,height:h}))} 
      />
      {/* top face, lit from the upper left */}
      <span
        className={("ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-top-0d4406"+' '+"ch-box-shadow-caed6f")+" "+(materialClass(material,'top')+' '+furnitureRadius(radius)+' '+geometryClass({height:h}))} 
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
      className={("ch-display-2a1b75")+" "+(flatPaint(background)+' '+furnitureRadius(radius)+' '+(shadow?'ch-furniture-inlay-shadow':'')+' '+geometryClass({width:w,height:h}))} 
    />
  );
}

/** One shaded sphere of foliage. */
function Leaf({ x, y, size, tone }: { x: number; y: number; size: number; tone: string }) {
  return (
    <span
      className={("ch-position-bb6a43"+' '+"ch-border-radius-9eaa9c")+" "+('ch-leaf'+' '+geometryClass({left:x,top:y,width:size,height:size}))} 
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
            className={("ch-position-bb6a43"+' '+"ch-left-635b13"+' '+"ch-top-95a770"+' '+"ch-transform-1b8ae7"+' '+"ch-height-1d9069"+' '+"ch-background-6ccfa0"+' '+"ch-border-radius-84df20")+" "+(geometryClass({width:w * 0.44}))} 
          />
          <span
            className={"ch-position-bb6a43"+' '+"ch-right-e20f42"+' '+"ch-bottom-ce3bb6"+' '+"ch-width-74b3e7"+' '+"ch-height-b9986b"+' '+"ch-background-98f40e"+' '+"ch-border-10b2bf"+' '+"ch-border-radius-84df20"} 
          />
        </Solid>
      );

    case "chair":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + d + 4}))} >
          {/* the back, a low bar behind the seat */}
          <span
            className={("ch-position-bb6a43"+' '+"ch-left-51b783"+' '+"ch-right-8074b2"+' '+"ch-top-0d4406"+' '+"ch-height-925e0a"+' '+"ch-border-radius-a360d0")+" "+('ch-material-soft-side')} 
          />
          <span className={"ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-top-95a770"} >
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
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + d + 6}))} >
          <span
            className={("ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-top-0d4406"+' '+"ch-height-b9986b"+' '+"ch-border-radius-6300ab")+" "+('ch-material-soft-side')} 
          />
          <span className={"ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-top-64f465"} >
            <Solid w={w} h={h} depth={d} radius="var(--radius-object-lg)" material={SOFT}>
              <span
                className={("ch-position-bb6a43"+' '+"ch-left-8bfc9d"+' '+"ch-top-288ddb"+' '+"ch-border-radius-a360d0"+' '+"ch-opacity-51faa6")+" "+('ch-material-soft-top'+' '+geometryClass({width:w / 2 - 8,height:h - 8}))} 
              />
              <span
                className={("ch-position-bb6a43"+' '+"ch-right-8188c1"+' '+"ch-top-288ddb"+' '+"ch-border-radius-a360d0"+' '+"ch-opacity-51faa6")+" "+('ch-material-soft-top'+' '+geometryClass({width:w / 2 - 8,height:h - 8}))} 
              />
            </Solid>
          </span>
        </span>
      );

    case "plant":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h}))} >
          <span className={("ch-position-bb6a43"+' '+"ch-bottom-ad3760")+" "+(geometryClass({left:(w - 20) / 2}))} >
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
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h}))} >
          <span className={"ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-bottom-ad3760"} >
            <Solid w={w} h={20} depth={d} radius="var(--radius-object-sm)" material={METAL} />
          </span>
          {/* the bottle: glass, so it reads as water */}
          <span className={"ch-position-bb6a43"+' '+"ch-left-f7bcc1"+' '+"ch-top-0d4406"} >
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
            className={"ch-position-bb6a43"+' '+"ch-inset-inline-58baad"+' '+"ch-bottom-ce3bb6"+' '+"ch-height-ba2ef8"+' '+"ch-background-ea65cd"+' '+"ch-border-radius-84df20"+' '+"ch-opacity-e1549f"} 
          />
        </Solid>
      );

    case "shelf":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* books: alternating warm tones, low chroma */}
          <span
            className={"ch-position-bb6a43"+' '+"ch-inset-a4522e"+' '+"ch-display-75816c"+' '+"ch-flex-direction-06c8b5"+' '+"ch-gap-d76768"} 
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={"ch-flex-97445a"+' '+(i % 2?"ch-background-b80482":"ch-background-941d54")+' '+"ch-border-radius-84df20"+' '+"ch-opacity-31c9f8"} 
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
            className={"ch-position-bb6a43"+' '+"ch-inset-inline-5d1292"+' '+"ch-top-64f465"+' '+"ch-height-925e0a"+' '+"ch-background-6ccfa0"+' '+"ch-border-radius-84df20"} 
          />
          {/* the output tray */}
          <span
            className={"ch-position-bb6a43"+' '+"ch-inset-inline-c245e3"+' '+"ch-bottom-ce3bb6"+' '+"ch-height-cc3d9d"+' '+"ch-background-7f0f18"+' '+"ch-border-radius-84df20"} 
          />
        </Solid>
      );

    case "bin":
      return <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />;

    case "bench":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          {/* slats */}
          <span className={"ch-position-bb6a43"+' '+"ch-inset-8a9728"+' '+"ch-display-75816c"+' '+"ch-flex-direction-06c8b5"+' '+"ch-gap-206a0d"} >
            {[0, 1].map((i) => (
              <span key={i} className={"ch-flex-97445a"+' '+"ch-background-45587b"+' '+"ch-border-radius-edd97e"+' '+"ch-opacity-f76fbb"}  />
            ))}
          </span>
        </Solid>
      );

    case "mic":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + 8}))} >
          {/* the stand */}
          <span
            className={("ch-position-bb6a43"+' '+"ch-top-288ddb"+' '+"ch-width-208c98"+' '+"ch-background-6ccfa0"+' '+"ch-border-radius-edd97e")+" "+(geometryClass({left:w / 2 - 1,height:h}))} 
          />
          <Solid w={w} h={h} depth={d} radius="50%" material={METAL} />
        </span>
      );

    case "lamp":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + 8}))} >
          {/* the pool of light it casts, which is the point of drawing a lamp */}
          <span
            className={("ch-position-bb6a43"+' '+"ch-left-da3c8d"+' '+"ch-top-fc3d0d"+' '+"ch-border-radius-9eaa9c"+' '+"ch-background-bfd524")+" "+(geometryClass({width:w + 20,height:h + 20}))} 
          />
          <Solid w={w} h={h} depth={8} radius="50%" material={POT} />
        </span>
      );

    /* ---- prayer room ---- */

    /* The mihrab: the niche marking the qibla. It is drawn as an arch set into
       the wall, and every rug in the room is laid facing it. */
    case "mihrab":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h + d}))} >
          <span
            className={("ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-background-45587b")+" "+('ch-furniture-arch'+' '+geometryClass({top:d,height:h}))} 
          />
          <span
            className={("ch-position-bb6a43"+' '+"ch-inset-inline-76a6aa"+' '+"ch-top-0d4406"+' '+"ch-background-c8b21e"+' '+"ch-box-shadow-caed6f")+" "+('ch-furniture-arch'+' '+geometryClass({height:h}))} 
          />
          {/* the recess itself, darker because it is a niche */}
          <span
            className={("ch-position-bb6a43"+' '+"ch-top-95a770"+' '+"ch-background-45587b"+' '+"ch-opacity-31c9f8")+" "+('ch-furniture-arch'+' '+geometryClass({left:w * 0.28,width:w * 0.44,height:h - 3}))} 
          />
        </span>
      );

    /* A rug lies in the floor rather than standing on it, so it takes the flat
       primitive: no extrusion, no contact shadow. */
    case "prayer-rug":
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h}))} >
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
            className={("ch-position-bb6a43"+' '+"ch-top-64f465"+' '+"ch-border-b019fd"+' '+"ch-opacity-94ec8e")+" "+('ch-furniture-arch'+' '+geometryClass({left:w * 0.26,width:w * 0.48,height:h * 0.3}))} 
          />
          <span
            className={"ch-position-bb6a43"+' '+"ch-inset-inline-5d1292"+' '+"ch-bottom-4c6900"+' '+"ch-height-32ec1b"+' '+"ch-background-d760d2"+' '+"ch-border-radius-edd97e"+' '+"ch-opacity-c4c3c1"} 
          />
        </span>
      );

    case "shoe-rack":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span className={"ch-position-bb6a43"+' '+"ch-inset-45f6cf"+' '+"ch-display-75816c"+' '+"ch-gap-fce9b2"} >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={"ch-flex-97445a"+' '+"ch-background-45587b"+' '+"ch-border-radius-84df20"+' '+"ch-opacity-e1549f"} 
              />
            ))}
          </span>
        </Solid>
      );

    case "book-shelf-low":
      return (
        <Solid w={w} h={h} depth={d} radius="var(--radius-object-sm)" material={OAK}>
          <span className={"ch-position-bb6a43"+' '+"ch-inset-5d3566"+' '+"ch-display-75816c"+' '+"ch-gap-206a0d"} >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={"ch-flex-97445a"+' '+(i % 2?"ch-background-b80482":"ch-background-941d54")+' '+"ch-border-radius-84df20"+' '+"ch-opacity-383082"} 
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
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h}))} >
          <Flat w={w} h={h} radius="var(--radius-object-sm)" background="var(--color-floor)" />
          <span
            className={"ch-position-bb6a43"+' '+"ch-left-261659"+' '+"ch-top-0d4406"+' '+"ch-width-cefbfe"+' '+"ch-height-ca02a9"+' '+"ch-border-inline-start-4c0f32"+' '+"ch-border-bottom-ec165b"+' '+"ch-border-end-start-radius-ad032a"+' '+"ch-opacity-94ec8e"} 
          />
        </span>
      );

    /* Glazing: daylight, so it spills a pool of light onto the floor inside.
       The pool is what makes a window a window rather than a pale bar. */
    case "window-h":
    case "window-v": {
      const horizontal = kind === "window-h";
      return (
        <span className={("ch-position-d461c9"+' '+"ch-display-2a1b75")+" "+(geometryClass({width:w,height:h}))} >
          <span
            aria-hidden="true"
            className={("ch-position-bb6a43"+' '+(horizontal?"ch-left-7a2402":"ch-left-ced581")+' '+(horizontal?"ch-top-0d4406":"ch-top-c4e8b6")+' '+(horizontal?"ch-background-c1c007":"ch-background-70edd5")+' '+"ch-pointer-events-8b1364")+" "+(geometryClass({width:horizontal ? w + 28 : 64,height:horizontal ? 64 : h + 28}))} 
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
      className={"pointer-events-none absolute inset-0 overflow-hidden "+("ch-border-radius-9d9174")}
      
    >
      {pieces.map((piece: Piece, i: number) => (
        <span
          key={`${piece.kind}-${i}`}
          className={("absolute "+("ch-line-height-3c11d0"))+" "+(geometryClass({left:`${piece.x}%`,top:`${piece.y}%`,transform:`translate(-50%, -50%) rotate(${piece.rot ?? 0}deg) scale(${piece.scale ?? 1})`}))}
          
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
