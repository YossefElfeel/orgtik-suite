import { msgText } from "@/lib/messages";
/**
 * SOMION HQ - APPEARANCE
 *
 * The system colour is the one visual choice that belongs to the person, not
 * the workspace: it changes how HQ looks on their device and nothing about
 * what anyone else sees. So it lives in localStorage, not in the store's
 * workspace state, and a reset of the workspace leaves it alone.
 *
 * Each preset re-points the seven brand primitives; every accent, focus ring
 * and primary button follows because nothing references a raw colour. The
 * ramps are the rose ramp with its hue rotated in OKLCH, so lightness and
 * chroma per step - and therefore every contrast pair - stay the same.
 *
 * Why these five and not a blue: the six presence hues are the only saturated
 * colour in the product, and an accent within 30 degrees of one of them would
 * read as a status. Teal, amber, violet and blue are therefore not offered.
 * Midnight and Graphite are near-neutral, which is how they stay clear of all
 * of them at once.
 */

export type AccentId = "brand" | "rose" | "orchid" | "olive" | "midnight" | "graphite";

export interface AccentPreset {
  id: AccentId;
  label: string;
  blurb: string;
  /** The 600 step: what a primary button is painted with (a token, so it holds in both themes). */
  swatch: string;
}

export const ACCENTS: AccentPreset[] = [
  { id: "brand", label: msgText("accent.brand", "OrgTik"), blurb: msgText("accent.brand.blurb", "The default: the suite's own colour."), swatch: "var(--color-swatch-brand)" },
  { id: "rose", label: msgText("accent.rose", "Rose"), blurb: msgText("accent.rose.blurb", "Warm, and unlike any status."), swatch: "var(--color-swatch-rose)" },
  { id: "orchid", label: msgText("accent.orchid", "Orchid"), blurb: msgText("accent.orchid.blurb", "Cooler and a little quieter."), swatch: "var(--color-swatch-orchid)" },
  { id: "olive", label: msgText("accent.olive", "Olive"), blurb: msgText("accent.olive.blurb", "Earthy; sits well with the floor."), swatch: "var(--color-swatch-olive)" },
  { id: "midnight", label: msgText("accent.midnight", "Midnight"), blurb: msgText("accent.midnight.blurb", "Near-black with a hint of blue."), swatch: "var(--color-swatch-midnight)" },
  { id: "graphite", label: msgText("accent.graphite", "Graphite"), blurb: msgText("accent.graphite.blurb", "No colour at all. The floor carries it."), swatch: "var(--color-swatch-graphite)" },
];

export const DEFAULT_ACCENT: AccentId = "brand";
const STORAGE_KEY = "hq.accent";

export function isAccent(v: unknown): v is AccentId {
  return typeof v === "string" && ACCENTS.some((a) => a.id === v);
}

/** What this device has chosen. Safe on the server and in a private window. */
export function readAccent(): AccentId {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isAccent(v) ? v : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

/** Paint it and remember it. The default clears the attribute rather than
    naming itself, so the stylesheet's own values apply untouched. */
export function applyAccent(id: AccentId): void {
  if (typeof document === "undefined") return;
  if (id === DEFAULT_ACCENT) delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = id;
  try {
    if (id === DEFAULT_ACCENT) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* Storage refused: the choice lasts for this page, which is still correct. */
  }
}

/**
 * Runs before anything paints, inline in the document, so a person who chose
 * Olive never sees a rose flash on load. Kept to one statement and no
 * dependencies for exactly that reason.
 */
export const ACCENT_BOOT_SCRIPT =
  'try{var a=localStorage.getItem("' +
  STORAGE_KEY +
  '");if(a&&a!=="' +
  DEFAULT_ACCENT +
  '")document.documentElement.setAttribute("data-accent",a)}catch(e){}';
