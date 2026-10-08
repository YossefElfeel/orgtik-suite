// Local entry for the same isolated presentation handler used by hosted mock.
const http=require('node:http');
const {createPresentationHandler}=require('../../mock/lib/presentation');
const port=Number(process.env.ORGTIK_PRESENTATION_PORT||7577);
http.createServer(createPresentationHandler()).listen(port,'127.0.0.1',()=>console.log('Presentation connections: http://localhost:'+port+' · memory-only simulated records'));
