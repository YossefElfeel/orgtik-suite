const zlib = require("node:zlib");
const MAX_BYTES = 16 * 1024 * 1024;
function encodeDomainCheckpoint(value) {
  const raw = Buffer.from(JSON.stringify(value));
  if (raw.length > MAX_BYTES) throw Object.assign(new Error("Workspace snapshot exceeds the supported limit."), { status: 503 });
  return { version: 1, encoding: "gzip-base64", bytes: raw.length, data: zlib.gzipSync(raw).toString("base64") };
}
function decodeDomainCheckpoint(value) {
  if (value?.version !== 1 || value.encoding !== "gzip-base64" || !Number.isSafeInteger(value.bytes) || value.bytes < 0 || value.bytes > MAX_BYTES || typeof value.data !== "string") throw Object.assign(new Error("Invalid workspace checkpoint."), { status: 503 });
  const raw = zlib.gunzipSync(Buffer.from(value.data, "base64"), { maxOutputLength: MAX_BYTES });
  if (raw.length !== value.bytes) throw Object.assign(new Error("Workspace checkpoint is incomplete."), { status: 503 });
  return JSON.parse(raw.toString("utf8"));
}
module.exports = { encodeDomainCheckpoint, decodeDomainCheckpoint };
