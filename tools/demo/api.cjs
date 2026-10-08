// Use the existing server unchanged, with all writable paths inside this run.
const path = require('node:path');
const config = require('../../mock/config');
if (!process.env.ORGTIK_DEMO_RUN_DIR) throw new Error('Start this API through pnpm demo.');
config.dataDir = path.join(process.env.ORGTIK_DEMO_RUN_DIR, 'data');
require('../../mock/server');
