// Conventional Express entrypoint so Vercel selects this app rather than the
// standalone, multi-port local harness in server.js.
module.exports = require("./services.cjs");
