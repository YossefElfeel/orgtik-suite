// Produce public URL settings only. Database credentials stay in the Marketplace bindings.
import fs from "node:fs";
import path from "node:path";
import configuration from "./validate-env.cjs";
const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
const output = path.resolve(process.argv[2]);
fs.mkdirSync(output, { recursive: true });
const origins = (preview) => Object.fromEntries(Object.keys(configuration.requirements).map(key => [key, preview ? manifest.projects[key].previewUrl : `https://orgtik-suite-${key}.vercel.app`]));
const batches = [];
for (const [key, project] of Object.entries(manifest.projects)) {
  const values = [];
  for (const target of ["production", "preview"]) {
    const preview = target === "preview";
    const urls = origins(preview);
    const mock = preview ? manifest.projects.mock.previewUrl : "https://orgtik-suite-mock.vercel.app";
    const env = key === "mock" ? { MOCK_PUBLIC_URL: mock, MOCK_SANDBOX: preview ? "preview" : "demo", SUITE_WEB_URLS: JSON.stringify(urls) } : Object.fromEntries(Object.entries(configuration.requirements[key]).map(([name, suffix]) => [name, suffix ? mock + suffix : name === "VITE_WM_ORIGIN" || name === "NEXT_PUBLIC_WM_URL" ? urls.wm : name === "NEXT_PUBLIC_WEBSITE_URL" ? urls.website : urls.sos]));
    if (key !== "mock") configuration.validate(key, { ...env, VERCEL: "1" });
    for (const [name, value] of Object.entries(env)) values.push({ key: name, value, type: "plain", target: [target] });
  }
  const file = path.join(output, `${key}.json`);
  fs.writeFileSync(file, JSON.stringify(values));
  batches.push({ key, projectId: project.projectId, file });
}
const urls = origins(true);
const previewValues = ["production", "preview"].flatMap(target => Object.entries({ MOCK_PUBLIC_URL: manifest.projects.mock.previewUrl, MOCK_SANDBOX: "preview", SUITE_WEB_URLS: JSON.stringify(urls) }).map(([key, value]) => ({ key, value, type: "plain", target: [target] })));
const previewFile = path.join(output, "mock-preview.json");
fs.writeFileSync(previewFile, JSON.stringify(previewValues));
batches.push({ key: "mock-preview", projectId: manifest.projects.mock.previewProjectId, file: previewFile });
fs.writeFileSync(path.join(output, "batches.json"), JSON.stringify(batches));
console.log(`Prepared public URL settings for ${batches.length} projects`);
