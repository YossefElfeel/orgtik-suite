// Descriptive contracts for the isolated prototype bridge; not a production authorization scheme.
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'connections.cjs'), 'utf8');
const routes = [...source.matchAll(/req\.method==='(GET|POST)'&&url\.pathname==='([^']+)'/g)].map(([, method, route]) => ({ method, path: route, workspaceScoped: true, response: { simulated: true, data: 'route-specific record or list' }, access: 'Presentation persona projection; app admission uses existing signed session separately' }));
const contract = { version: 1, source: 'tools/demo/connections.cjs', mode: 'isolated-memory-presentation', persistence: 'discarded when this demo service restarts', query: { workspace: ['current', 'nile', 'orgtik', 'spree', 'desert', 'new'], persona: ['current', 'mona', 'nour', 'rana', 'omar', 'salma', 'hoda', 'hany'] }, invariants: ['No account, invoice, CMS, journal or shared clock store is read or changed', 'Files references retain workspace, record, version and packaged asset path', 'OrgTik won-deal workspace receipts are simulated records, not account/billing provisioning'], routes };
fs.writeFileSync(path.join(__dirname, 'contracts.json'), JSON.stringify(contract, null, 2) + '\n');
console.log(`Generated ${routes.length} presentation route contracts.`);
