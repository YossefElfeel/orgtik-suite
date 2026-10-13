// Express entrypoint for the new Services project. The existing API entrypoint
// still owns persistence and dispatch; no second backend or store is introduced.
process.env.ORGTIK_SERVICES = "1";
if (process.env.VERCEL_ENV === "development" || process.env.VERCEL_DEV_PORT) require("./services-local.cjs");
const express = require("express");
const handler = require("./api/index.js");
const app = express();
app.use((req, res, next) => Promise.resolve(handler(req, res)).catch(next));
module.exports = app;
