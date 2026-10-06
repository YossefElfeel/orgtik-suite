/**
 * SOMION HQ - FLOOR FURNITURE
 *
 * What makes a bay read as a room rather than a rectangle: desks, chairs,
 * tables, plants, a water cooler, a coffee machine, shelves, screens, doors and
 * windows.
 *
 * Three rules hold this to the design system rather than letting it become
 * decoration:
 *
 *   1. THE PERSON OUTRANKS THE FURNITURE. Every piece is drawn from the warm
 *      paper ramp at low contrast (roughly 1.2-1.4 against its room). A person
 *      carries a white ring, a dark initial and a name plate, so they win the
 *      depth contest from every direction. Furniture that competes with people
 *      would defeat the entire product.
 *   2. NO NEW SATURATION. Presence owns colour. The only hue here is a
 *      desaturated sage for foliage, which sits 87 degrees from the available
 *      teal and could never be mistaken for a status lamp.
 *   3. NOT ILLUSTRATION. Every piece is a token-coloured rounded rectangle or
 *      circle, sized in fixed pixels so nothing distorts as the floor scales.
 *      There is no asset pipeline, nothing to redraw, and it stays on-brand
 *      because it is made of the same materials as the rest of the interface.
 *
 * Layouts are hand-composed per room rather than generated: a floor plan is
 * designed, and a randomised one looks it.
 */

export type PieceKind =
  | "desk"
  | "chair"
  | "table-round"
  | "table-oval"
  | "stool"
  | "sofa"
  | "plant"
  | "cooler"
  | "coffee"
  | "shelf"
  | "screen"
  | "rug"
  | "door"
  | "window-h"
  | "window-v"
  /* Prayer room. A mihrab is the niche marking the qibla - the direction of
     prayer - so it is the one piece in the room whose orientation carries
     meaning rather than decoration. */
  | "prayer-rug"
  | "mihrab"
  | "shoe-rack"
  | "book-shelf-low"
  /* Detail pieces, to give the existing rooms something to look at. */
  | "monitor"
  | "whiteboard"
  | "printer"
  | "lamp"
  | "bin"
  | "bench"
  | "mic";

export interface Piece {
  kind: PieceKind;
  /** Position within the room, in percent of the room's own box. */
  x: number;
  y: number;
  /** Degrees. Only meaningful for pieces that have a facing. */
  rot?: number;
  /** Multiplier on the piece's base size, for the occasional larger item. */
  scale?: number;
}

/**
 * Base size in CSS pixels. Fixed, so circles stay circular at any floor size.
 * Sized against a person: an avatar is 40px, so a desk is comfortably wider
 * than someone sitting at it and a chair is a little narrower. Furniture drawn
 * smaller than this reads as specks rather than as a room.
 */
export const PIECE_SIZE: Record<PieceKind, { w: number; h: number }> = {
  desk: { w: 74, h: 32 },
  chair: { w: 24, h: 17 },
  "table-round": { w: 86, h: 86 },
  "table-oval": { w: 120, h: 66 },
  stool: { w: 20, h: 20 },
  sofa: { w: 90, h: 36 },
  plant: { w: 34, h: 38 },
  cooler: { w: 26, h: 44 },
  coffee: { w: 34, h: 30 },
  shelf: { w: 24, h: 104 },
  screen: { w: 76, h: 9 },
  rug: { w: 210, h: 150 },
  door: { w: 46, h: 11 },
  "window-h": { w: 90, h: 8 },
  "window-v": { w: 8, h: 90 },

  "prayer-rug": { w: 40, h: 62 },
  mihrab: { w: 54, h: 14 },
  "shoe-rack": { w: 40, h: 20 },
  "book-shelf-low": { w: 46, h: 18 },

  monitor: { w: 40, h: 8 },
  whiteboard: { w: 84, h: 8 },
  printer: { w: 30, h: 26 },
  lamp: { w: 16, h: 16 },
  bin: { w: 16, h: 16 },
  bench: { w: 64, h: 14 },
  mic: { w: 14, h: 14 },
};

/* -------------------------------------------------------------------------
   Layouts, keyed by room id. Each is arranged around how the room is actually
   used: desks in rows with circulation between them, a meeting table centred
   under a wall screen, focus desks along a wall facing away from the door.
   ---------------------------------------------------------------------- */

export const ROOM_FURNITURE: Record<string, Piece[]> = {
  /* Open plan. Two rows of three, generous circulation down the middle, with
     the cooler by the door and a plant in the far corner. */
  "r-desks": [
    { kind: "desk", x: 22, y: 30 },
    { kind: "chair", x: 22, y: 18 },
    { kind: "desk", x: 50, y: 30 },
    { kind: "chair", x: 50, y: 18 },
    { kind: "desk", x: 78, y: 30 },
    { kind: "chair", x: 78, y: 18 },

    { kind: "desk", x: 22, y: 72 },
    { kind: "chair", x: 22, y: 60 },
    { kind: "desk", x: 50, y: 72 },
    { kind: "chair", x: 50, y: 60 },
    { kind: "desk", x: 78, y: 72 },
    { kind: "chair", x: 78, y: 60 },

    { kind: "cooler", x: 93, y: 90 },
    { kind: "printer", x: 60, y: 92 },
    { kind: "bin", x: 45, y: 93 },
    { kind: "lamp", x: 8, y: 52 },
    { kind: "plant", x: 8, y: 90 },
    { kind: "plant", x: 93, y: 12, scale: 0.85 },
    { kind: "window-h", x: 30, y: 1 },
    { kind: "window-h", x: 70, y: 1 },
    { kind: "window-v", x: 1, y: 45 },
    { kind: "door", x: 78, y: 99 },
  ],

  /* The larger meeting room: an oval table under a wall screen. */
  "r-a": [
    { kind: "screen", x: 50, y: 6 },
    { kind: "table-oval", x: 50, y: 50 },
    { kind: "chair", x: 26, y: 34 },
    { kind: "chair", x: 50, y: 28 },
    { kind: "chair", x: 74, y: 34 },
    { kind: "chair", x: 26, y: 66 },
    { kind: "chair", x: 50, y: 72 },
    { kind: "chair", x: 74, y: 66 },
    { kind: "chair", x: 14, y: 50 },
    { kind: "chair", x: 86, y: 50 },
    { kind: "plant", x: 88, y: 89 },
    { kind: "whiteboard", x: 50, y: 93 },
    { kind: "bin", x: 12, y: 89 },
    { kind: "window-h", x: 50, y: 1 },
    { kind: "door", x: 30, y: 99 },
  ],

  /* The small room: a round table, six seats, same screen convention. */
  "r-b": [
    { kind: "screen", x: 50, y: 6, scale: 0.7 },
    { kind: "table-round", x: 50, y: 50, scale: 0.82 },
    { kind: "chair", x: 30, y: 34 },
    { kind: "chair", x: 70, y: 34 },
    { kind: "chair", x: 20, y: 58 },
    { kind: "chair", x: 80, y: 58 },
    { kind: "chair", x: 40, y: 76 },
    { kind: "chair", x: 62, y: 76 },
    { kind: "window-v", x: 98, y: 40 },
    { kind: "door", x: 50, y: 99 },
  ],

  /* Focus: single desks along the wall, facing away from the door. */
  "r-quiet": [
    { kind: "desk", x: 46, y: 16, scale: 0.82 },
    { kind: "chair", x: 46, y: 27 },
    { kind: "desk", x: 46, y: 48, scale: 0.82 },
    { kind: "chair", x: 46, y: 59 },
    { kind: "desk", x: 46, y: 80, scale: 0.82 },
    { kind: "chair", x: 46, y: 91 },
    { kind: "plant", x: 86, y: 12 },
    { kind: "lamp", x: 84, y: 44 },
    { kind: "monitor", x: 46, y: 8, scale: 0.7 },
    { kind: "window-v", x: 2, y: 50 },
    { kind: "door", x: 50, y: 99 },
  ],

  /* Kitchen: a counter with the coffee machine, a table to sit at, a sofa. */
  "r-lounge": [
    { kind: "coffee", x: 26, y: 10 },
    { kind: "desk", x: 62, y: 11, scale: 0.9 },
    { kind: "table-round", x: 50, y: 42, scale: 0.78 },
    { kind: "stool", x: 27, y: 42 },
    { kind: "stool", x: 73, y: 42 },
    { kind: "stool", x: 50, y: 20 },
    { kind: "stool", x: 50, y: 64 },
    { kind: "sofa", x: 50, y: 84, scale: 0.8 },
    { kind: "plant", x: 88, y: 90 },
    { kind: "plant", x: 12, y: 90, scale: 0.8 },
    { kind: "window-v", x: 98, y: 55 },
    { kind: "door", x: 50, y: 99 },
  ],

  /* Prayer room. Rugs are laid in rows facing the mihrab on the qibla wall,
     which is what makes the room legible as a prayer space rather than another
     empty meeting room. Shoes come off at the door, so the rack is by it. */
  "r-prayer": [
    { kind: "mihrab", x: 50, y: 5 },
    { kind: "prayer-rug", x: 28, y: 36 },
    { kind: "prayer-rug", x: 72, y: 36 },
    { kind: "prayer-rug", x: 28, y: 66 },
    { kind: "prayer-rug", x: 72, y: 66 },
    { kind: "book-shelf-low", x: 16, y: 91, scale: 0.8 },
    { kind: "shoe-rack", x: 78, y: 92, scale: 0.8 },
    { kind: "plant", x: 88, y: 14, scale: 0.8 },
    { kind: "window-v", x: 2, y: 45 },
    { kind: "door", x: 50, y: 99 },
  ],

  /* Library: shelves down one wall, two quiet desks, a reading chair. */
  "r-library": [
    { kind: "shelf", x: 8, y: 34 },
    { kind: "shelf", x: 8, y: 74 },
    { kind: "desk", x: 46, y: 32, scale: 0.85 },
    { kind: "chair", x: 46, y: 47 },
    { kind: "desk", x: 46, y: 72, scale: 0.85 },
    { kind: "chair", x: 46, y: 87 },
    { kind: "sofa", x: 84, y: 46, rot: 90, scale: 0.75 },
    { kind: "plant", x: 84, y: 88 },
    { kind: "window-h", x: 55, y: 1 },
    { kind: "door", x: 24, y: 99 },
  ],
};

/* -------------------------------------------------------------------------
   Defaults by kind. A room the admin adds has no hand-composed layout, and a
   bare rectangle would be the first thing they see. Each kind gets a generic
   arrangement in percentages of the room, so it reads as that kind of room at
   any size. A per-room layout above always wins.
   ---------------------------------------------------------------------- */

export const KIND_FURNITURE: Record<string, Piece[]> = {
  meeting: [
    { kind: "screen", x: 50, y: 6, scale: 0.8 },
    { kind: "table-oval", x: 50, y: 50, scale: 0.85 },
    { kind: "chair", x: 30, y: 30 },
    { kind: "chair", x: 70, y: 30 },
    { kind: "chair", x: 30, y: 70 },
    { kind: "chair", x: 70, y: 70 },
    { kind: "plant", x: 88, y: 88, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
  boardroom: [
    { kind: "screen", x: 50, y: 5 },
    { kind: "table-oval", x: 50, y: 50, scale: 1.3 },
    { kind: "chair", x: 22, y: 30 },
    { kind: "chair", x: 40, y: 26 },
    { kind: "chair", x: 60, y: 26 },
    { kind: "chair", x: 78, y: 30 },
    { kind: "chair", x: 22, y: 70 },
    { kind: "chair", x: 40, y: 74 },
    { kind: "chair", x: 60, y: 74 },
    { kind: "chair", x: 78, y: 70 },
    { kind: "chair", x: 10, y: 50 },
    { kind: "chair", x: 90, y: 50 },
    { kind: "plant", x: 90, y: 90, scale: 0.8 },
    { kind: "window-h", x: 50, y: 1 },
    { kind: "door", x: 50, y: 99 },
  ],
  booth: [
    { kind: "desk", x: 50, y: 30, scale: 0.6 },
    { kind: "stool", x: 50, y: 58 },
    { kind: "lamp", x: 80, y: 18, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
  studio: [
    { kind: "desk", x: 50, y: 28, scale: 0.9 },
    { kind: "mic", x: 36, y: 46 },
    { kind: "mic", x: 64, y: 46 },
    { kind: "chair", x: 36, y: 62 },
    { kind: "chair", x: 64, y: 62 },
    { kind: "shelf", x: 10, y: 50, scale: 0.7 },
    { kind: "shelf", x: 90, y: 50, scale: 0.7 },
    { kind: "screen", x: 50, y: 6, scale: 0.7 },
    { kind: "door", x: 50, y: 99 },
  ],
  training: [
    { kind: "whiteboard", x: 50, y: 5 },
    { kind: "desk", x: 30, y: 30, scale: 0.75 },
    { kind: "desk", x: 70, y: 30, scale: 0.75 },
    { kind: "chair", x: 30, y: 40 },
    { kind: "chair", x: 70, y: 40 },
    { kind: "desk", x: 30, y: 58, scale: 0.75 },
    { kind: "desk", x: 70, y: 58, scale: 0.75 },
    { kind: "chair", x: 30, y: 68 },
    { kind: "chair", x: 70, y: 68 },
    { kind: "desk", x: 30, y: 84, scale: 0.75 },
    { kind: "desk", x: 70, y: 84, scale: 0.75 },
    { kind: "door", x: 12, y: 99 },
  ],
  focus: [
    { kind: "desk", x: 50, y: 30, scale: 0.85 },
    { kind: "chair", x: 50, y: 42 },
    { kind: "plant", x: 86, y: 86, scale: 0.8 },
    { kind: "lamp", x: 14, y: 20, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
  lounge: [
    { kind: "sofa", x: 50, y: 24, scale: 0.85 },
    { kind: "table-round", x: 50, y: 62, scale: 0.7 },
    { kind: "stool", x: 30, y: 62 },
    { kind: "stool", x: 70, y: 62 },
    { kind: "plant", x: 12, y: 88, scale: 0.8 },
    { kind: "plant", x: 88, y: 88, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
  reception: [
    { kind: "desk", x: 50, y: 22 },
    { kind: "chair", x: 50, y: 10 },
    { kind: "sofa", x: 50, y: 72, scale: 0.9 },
    { kind: "plant", x: 12, y: 88 },
    { kind: "plant", x: 88, y: 88 },
    { kind: "window-h", x: 50, y: 1 },
    { kind: "door", x: 50, y: 99 },
  ],
  outdoor: [
    { kind: "bench", x: 50, y: 30 },
    { kind: "bench", x: 50, y: 70 },
    { kind: "plant", x: 12, y: 14 },
    { kind: "plant", x: 88, y: 14 },
    { kind: "plant", x: 12, y: 86 },
    { kind: "plant", x: 88, y: 86 },
    { kind: "table-round", x: 50, y: 50, scale: 0.6 },
  ],
  wellness: [
    { kind: "sofa", x: 50, y: 40, scale: 0.9 },
    { kind: "lamp", x: 14, y: 20, scale: 0.9 },
    { kind: "plant", x: 86, y: 84, scale: 0.9 },
    { kind: "rug", x: 50, y: 60, scale: 0.6 },
    { kind: "door", x: 50, y: 99 },
  ],
  prayer: [
    { kind: "mihrab", x: 50, y: 5 },
    { kind: "prayer-rug", x: 30, y: 45 },
    { kind: "prayer-rug", x: 70, y: 45 },
    { kind: "shoe-rack", x: 78, y: 92, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
  desk: [
    { kind: "desk", x: 28, y: 30 },
    { kind: "chair", x: 28, y: 18 },
    { kind: "desk", x: 72, y: 30 },
    { kind: "chair", x: 72, y: 18 },
    { kind: "desk", x: 28, y: 70 },
    { kind: "chair", x: 28, y: 58 },
    { kind: "desk", x: 72, y: 70 },
    { kind: "chair", x: 72, y: 58 },
    { kind: "plant", x: 92, y: 90, scale: 0.8 },
    { kind: "door", x: 50, y: 99 },
  ],
};

/** The layout for a room: its own if it has one, else its kind's. */
export const furnitureFor = (room: { id: string; kind: string }): Piece[] =>
  ROOM_FURNITURE[room.id] ?? KIND_FURNITURE[room.kind] ?? [];
