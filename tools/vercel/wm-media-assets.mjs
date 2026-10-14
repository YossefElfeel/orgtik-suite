import fs from "node:fs";
import path from "node:path";

// Replacement history must keep the original image even when the website is a
// separate deployment. Package only the six raster files declared by the seed.
export function copyWmImageOriginals(mockRoot, repository = path.resolve(import.meta.dirname, "../..")) {
  const seed = JSON.parse(fs.readFileSync(path.join(repository, "mock/apps/wm/seed/website.json"), "utf8"));
  const destination = path.join(mockRoot, "apps/wm/assets");
  fs.mkdirSync(destination, { recursive: true });
  const files = seed.media.filter(row => row.kind === "image").map(row => row.file);
  for (const file of files) {
    if (path.basename(file) !== file || !/\.(webp|png|jpe?g)$/i.test(file)) throw new Error("Invalid WM seed image path.");
    const source = path.join(repository, "apps/website/landing-directions/public/assets", file);
    const target = path.join(destination, file);
    fs.copyFileSync(source, target);
    if (!fs.readFileSync(source).equals(fs.readFileSync(target))) throw new Error(`WM original image differs: ${file}`);
  }
  return files;
}
