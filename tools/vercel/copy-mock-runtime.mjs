// Vercel's trace omitted mock runtime dependencies despite a successful pnpm install. Use the
// isolated production graph from `pnpm deploy`, keeping the existing function's source/assets.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { mockFunction } from "./check-mock-bundle.mjs";

export function copyMockRuntime(runtime = ".vercel/mock-runtime", output = ".vercel/output") {
  const source = path.join(fs.realpathSync(runtime), "node_modules");
  if (!fs.existsSync(path.join(source, "express"))) throw new Error("The isolated mock runtime must contain express");
  const fn = mockFunction(output);
  const folder = fs.realpathSync(fn.folder);
  const destination = path.resolve(folder, "mock/node_modules");
  const inside = file => {
    const relative = path.relative(folder, file);
    return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  };
  if (!inside(destination)) throw new Error("Mock runtime destination must stay inside its generated function");
  try {
    const stat = fs.lstatSync(destination);
    if (stat.isSymbolicLink()) fs.unlinkSync(destination);
    else {
      if (!inside(fs.realpathSync(destination))) throw new Error("Existing mock runtime leaves its generated function");
      fs.rmSync(destination, { recursive: true, force: true });
    }
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  fs.cpSync(source, destination, { recursive: true, dereference: false, verbatimSymlinks: true });
  console.log("mock: copied isolated production dependencies into the function");
  // Vercel interprets HLS transport-stream .ts files as TypeScript while tracing. Restore the
  // complete reviewed sample asset tree after tracing; these bytes are runtime media, not code.
  const assets = path.resolve(import.meta.dirname, "../../mock/apps/files/assets");
  const packagedAssets = path.resolve(folder, "mock/apps/files/assets");
  if (!inside(packagedAssets)) throw new Error("Mock asset destination must stay inside its generated function");
  fs.cpSync(assets, packagedAssets, { recursive: true });
  console.log("mock: restored packaged Files sample assets byte-for-byte");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) copyMockRuntime(process.argv[2], process.argv[3]);
