const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const { dispatch } = require("./dispatch");

test("loopback keeps binary payloads, cookies and redirects across fresh connections", async () => {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push(req.socket);
    assert.equal(req.headers["x-mock-app"], "files");
    assert.equal(req.headers.connection, "close");
    if (req.url === "/redirect") return res.writeHead(302, { location: "/binary" }).end();
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => {
      res.writeHead(200, { "set-cookie": ["a=1; Path=/", "b=2; Path=/"], "content-type": "application/octet-stream" });
      res.end(Buffer.concat(chunks));
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const bytes = Buffer.from([0, 255, 13, 10, 128]);
    for (let n = 0; n < 3; n++) {
      const response = await dispatch(base, "files", { method: "POST", url: "/binary", headers: { connection: "keep-alive" }, body: bytes });
      assert.deepEqual(response.rawPayload, bytes);
      assert.deepEqual(response.headers["set-cookie"], ["a=1; Path=/", "b=2; Path=/"]);
      assert.equal(response.headers.connection, undefined);
    }
    assert.equal(new Set(seen).size, 3);
    const redirect = await dispatch(base, "files", { method: "GET", url: "/redirect" });
    assert.equal(redirect.statusCode, 302);
    assert.equal(redirect.headers.location, "/binary");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  await assert.rejects(dispatch(base, "files", { method: "POST", url: "/binary" }), { code: "ECONNREFUSED" });
});
