// Vercel entry: every mock API in one function, each under its app key
// (https://<mock>/sos/api/..., /tasks/..., /files/...). Data lives in memory, so it resets
// whenever the function starts cold; sockets (live updates) aren't available here.
process.env.ORGTIK_MOCK_NO_LISTEN = "1";
const { slots } = require("../server");

module.exports = (req, res) => {
  const m = /^\/([a-z_]+)(\/[^?]*)?(\?.*)?$/.exec(req.url || "/");
  const key = m && m[1];
  if (!key || !slots.has(key)) {
    res.statusCode = key ? 404 : 200;
    res.setHeader("content-type", "application/json");
    res.setHeader("access-control-allow-origin", "*");
    return res.end(JSON.stringify({ ok: !key, service: "OrgTik suite mock API", apps: [...slots.keys()].map((k) => `/${k}`) }));
  }
  req.url = (m[2] || "/") + (m[3] || "");
  return slots.get(key).app(req, res);
};
