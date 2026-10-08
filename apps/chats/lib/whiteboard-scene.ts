import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export type WhiteboardScene = { schema: "orgtik.whiteboard"; version: 1; elements: readonly ExcalidrawElement[]; appState: { viewBackgroundColor: string } };
const base = ["id", "type", "x", "y", "width", "height", "angle", "strokeColor", "backgroundColor", "fillStyle", "strokeWidth", "strokeStyle", "roundness", "roughness", "opacity", "seed", "version", "versionNonce", "index", "updated", "isDeleted", "groupIds", "frameId", "boundElements", "link", "locked"] as const;
const text = ["fontSize", "fontFamily", "text", "originalText", "textAlign", "verticalAlign", "containerId", "autoResize", "lineHeight"];
const linear = ["points", "lastCommittedPoint", "startBinding", "endBinding", "startArrowhead", "endArrowhead"];
const fields: Record<string, readonly string[]> = { rectangle: [], diamond: [], ellipse: [], line: linear, arrow: [...linear, "elbowed", "fixedSegments", "startIsSpecial", "endIsSpecial"], freedraw: ["points", "pressures", "simulatePressure", "lastCommittedPoint"], text, frame: ["name"] };
export const emptyWhiteboardScene = (): WhiteboardScene => ({ schema: "orgtik.whiteboard", version: 1, elements: [], appState: { viewBackgroundColor: "#ffffff" } });
export class SceneEncodingError extends Error {}
/** Only the persistent vector/text contract leaves the canvas, never view or binary state. */
export function encodeWhiteboardScene(elements: readonly ExcalidrawElement[], state: Pick<AppState, "viewBackgroundColor">, files: BinaryFiles = {}): WhiteboardScene {
  if (Object.keys(files).length || elements.some(element => !(element.type in fields) || element.link || element.customData)) throw new SceneEncodingError("unsupported_content");
  const clean = elements.map(element => {
    const source = element as unknown as Record<string, unknown>, out: Record<string, unknown> = {};
    for (const key of [...base, ...(fields[element.type] || [])]) if (source[key] !== undefined) out[key] = structuredClone(source[key]);
    for (const key of ["strokeColor", "backgroundColor"]) if (typeof out[key] === "string") out[key] = out[key].toLowerCase();
    out.link = null;
    return out as unknown as ExcalidrawElement;
  });
  const scene: WhiteboardScene = { schema: "orgtik.whiteboard", version: 1, elements: clean, appState: { viewBackgroundColor: state.viewBackgroundColor.toLowerCase() } };
  const points = clean.reduce((total, element) => total + ("points" in element ? element.points.length : 0), 0);
  const characters = clean.reduce((total, element) => total + (element.type === "text" ? element.text.length + element.originalText.length : 0), 0);
  if (clean.length > 1000 || points > 20000 || characters > 100000 || new TextEncoder().encode(JSON.stringify(scene)).length > 256 * 1024) throw new SceneEncodingError("scene_limit");
  return scene;
}
export function sceneFingerprint(scene: WhiteboardScene): string {
  return JSON.stringify({ ...scene, elements: scene.elements.map(element => {
    const value = { ...element } as unknown as Record<string, unknown>;
    for (const key of ["updated", "version", "versionNonce", "index", "lastCommittedPoint"]) delete value[key];
    if (!Array.isArray(value.boundElements) || value.boundElements.length === 0) value.boundElements = [];
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  }) });
}

