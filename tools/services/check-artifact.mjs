import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function inspectFunctions(output) {
  const files = fs.readdirSync(output, { recursive: true }).filter(file => file.endsWith(".vc-config.json"));
  const counts = {};
  for (const file of files) {
    const config = JSON.parse(fs.readFileSync(path.join(output, file), "utf8"));
    if (config.runtime === "edge") throw new Error(`Services cannot deploy Edge output: ${file}`);
    const service = file.split(path.sep)[0];
    counts[service] = (counts[service] || 0) + 1;
  }
  return { counts, total: files.length };
}
export function assertHobbyLimit(result) {
  if (result.total > 12) throw new Error(`Hobby permits 12 functions per deployment; this project has ${result.total}: ${JSON.stringify(result.counts)}. Upload was stopped.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = inspectFunctions(path.resolve(".vercel/output/services"));
  console.log(`Function inventory: ${JSON.stringify(result)}`);
  assertHobbyLimit(result);
}
