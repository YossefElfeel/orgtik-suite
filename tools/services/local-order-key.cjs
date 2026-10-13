const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// Local mock quote/claim signatures survive restarts, just like the file journal.
// Keep this key in ignored worktree state, never client configuration or source control.
function localOrderKey(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    try { fs.writeFileSync(file, crypto.randomBytes(32).toString("hex"), { flag: "wx", mode: 0o600 }); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  const key = fs.readFileSync(file, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("The local mock order signing key is invalid; existing claims were left unchanged.");
  return key;
}
module.exports = { localOrderKey };
