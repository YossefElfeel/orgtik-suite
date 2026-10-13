const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { localOrderKey } = require("./local-order-key.cjs");
function fixture(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-local-order-key-")), file = path.join(dir, "orders.key");
  try { run(file); } finally { if (fs.existsSync(file)) fs.unlinkSync(file); fs.rmdirSync(dir); }
}
test("local order signatures use a random key retained across cold starts", () => fixture(file => {
  const first = localOrderKey(file);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(localOrderKey(file), first);
  assert.equal(fs.readFileSync(file, "utf8"), first);
}));
test("a corrupted local key fails closed without invalidating old claims by replacement", () => fixture(file => {
  fs.writeFileSync(file, "invalid");
  assert.throws(() => localOrderKey(file), /left unchanged/);
  assert.equal(fs.readFileSync(file, "utf8"), "invalid");
}));
