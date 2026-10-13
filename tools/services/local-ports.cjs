const net = require('node:net');
const path = require('node:path');
function reserved(port) {
  const filename = require.resolve('next/dist/lib/helpers/get-reserved-port', { paths: [path.resolve(__dirname, '../../apps/sos')] });
  return require(filename).isPortIsReserved(port);
}
function probe(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { const value = server.address().port; server.close(error => error ? reject(error) : resolve(value)); });
  });
}
async function availableLocalPort(port = 0, { isReserved = reserved, getPort = probe } = {}) {
  if (port && isReserved(port)) throw Error(`Port ${port} is reserved by Next.js; choose another local port.`);
  for (let attempt = 0; attempt < 25; attempt++) { const value = await getPort(port); if (!isReserved(value)) return value; }
  throw Error('Could not allocate an unreserved local port.');
}
module.exports = { availableLocalPort };
