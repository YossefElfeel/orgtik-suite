// Prebuilt functions must resolve their imports from the uploaded artifact, not the checkout.
// Build on Linux: Windows pnpm links can contain backslashes that fail on Vercel's runtime.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export function checkMockBundle(output = ".vercel/output") {
  const root = fs.realpathSync(output);
  const contained = file => {
    const relative = path.relative(root, file);
    return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  };
  function walk(folder) {
    for (const name of fs.readdirSync(folder)) {
      const file = path.join(folder, name);
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(file);
        if (target.includes("\\")) throw new Error(`Non-portable function symlink: ${path.relative(root, file)}. Build on Linux.`);
        if (!contained(fs.realpathSync(file))) throw new Error(`Function symlink leaves the artifact: ${path.relative(root, file)}`);
      } else if (stat.isDirectory()) walk(file);
    }
  }
  const functions = path.join(root, "functions");
  walk(functions);
  const configFiles = fs.readdirSync(functions, { recursive: true }).filter(file => file.endsWith(".vc-config.json"));
  const candidates = configFiles.map(file => ({
    folder: path.dirname(path.join(functions, file)),
    config: JSON.parse(fs.readFileSync(path.join(functions, file), "utf8")),
  })).filter(({ config }) => config.handler?.replaceAll("\\", "/") === "mock/api/index.js");
  if (candidates.length !== 1) throw new Error("Expected exactly one mock/api/index.js function artifact");
  const entry = path.join(candidates[0].folder, candidates[0].config.handler);
  if (!fs.existsSync(entry)) throw new Error("The mock function handler is missing");
  const load = createRequire(entry);
  // These imports execute at module startup. Requiring them checks their transitive imports too,
  // without starting the mock, touching Redis, or invoking any test controls.
  for (const name of ["express", "cors", "multer", "socket.io", "@iconify/utils"]) {
    const resolved = fs.realpathSync(load.resolve(name));
    if (!contained(resolved)) throw new Error(`Mock dependency ${name} resolves outside the uploaded artifact`);
    load(name);
  }
  console.log("mock: self-contained Linux function artifact passed");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) checkMockBundle(process.argv[2]);
