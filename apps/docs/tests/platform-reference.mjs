import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const WINDOWS_PROFILE = "windows-2025-chromium-153";
const here = path.dirname(fileURLToPath(import.meta.url));
export const profileDirectory = path.join(here, "platform-references", WINDOWS_PROFILE);
const sha = value => crypto.createHash("sha256").update(value).digest("hex");

/** Explicit CI profile, exact renderer, only reviewed filenames. Default references stay intact. */
export function createReferenceResolver({ defaultDirectory, directory = profileDirectory, ci = false, requestedProfile = "", rendering }) {
  if (!ci || !requestedProfile) return name => ({ path: path.join(defaultDirectory, name), profile: "default" });
  if (requestedProfile !== WINDOWS_PROFILE) throw new Error(`No reviewed visual reference profile: ${requestedProfile}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
  if (manifest.id !== requestedProfile) throw new Error("Visual reference manifest/profile mismatch");
  for (const [key, expected] of Object.entries(manifest.renderer)) {
    if (JSON.stringify(rendering[key]) !== JSON.stringify(expected)) throw new Error(`Unreviewed renderer ${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(rendering[key])}`);
  }
  return name => {
    const entry = manifest.entries[name];
    const original = path.join(defaultDirectory, name);
    if (!entry) return { path: original, profile: "default" };
    if (name !== path.basename(name)) throw new Error("Invalid visual reference filename");
    if (!fs.existsSync(original) || sha(fs.readFileSync(original)) !== entry.originalSha256) throw new Error(`Stale paired reference: ${name}; review the platform pair after changing the default`);
    const candidate = path.join(directory, name);
    if (!fs.existsSync(candidate) || sha(fs.readFileSync(candidate)) !== entry.overrideSha256) throw new Error(`Corrupt or missing reviewed platform reference: ${name}`);
    return { path: candidate, profile: manifest.id, review: entry };
  };
}

/** Text, control state and pixel-level layout anchors validate the glyph-only reconciliation. */
export async function captureStorySemantics(page) {
  return page.evaluate(() => {
    const root = document.querySelector("#storybook-root");
    const box = el => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const elements = [...root.querySelectorAll("button,input,select,code,table,th,td,[role=grid],[data-date]")];
    return {
      text: root.textContent.replace(/\s+/g, " ").trim(),
      root: box(root),
      elements: elements.map(el => ({ tag: el.tagName, role: el.getAttribute("role"), label: el.getAttribute("aria-label"), text: el.textContent.replace(/\s+/g, " ").trim(), value: el.value ?? null, disabled: el.disabled ?? null, checked: el.checked ?? null, box: box(el) })),
    };
  });
}

export function semanticHashes(semantics) {
  const text = { text: semantics.text, elements: semantics.elements.map(({ box, ...element }) => element) };
  const layout = { root: semantics.root, elements: semantics.elements.map(el => ({ tag: el.tag, box: el.box })) };
  return { textSha256: sha(JSON.stringify(text)), layoutSha256: sha(JSON.stringify(layout)) };
}

export function reviewedSemanticErrors(review, semantics, platformFonts) {
  const hashes = semanticHashes(semantics);
  const errors = [];
  if (hashes.textSha256 !== review.semantics.textSha256) errors.push("Reviewed story text or control state changed");
  if (hashes.layoutSha256 !== review.semantics.layoutSha256) errors.push("Reviewed story layout anchors changed");
  if (JSON.stringify(platformFonts) !== JSON.stringify(review.platformFonts)) errors.push("Reviewed platform font selection changed");
  return errors;
}
