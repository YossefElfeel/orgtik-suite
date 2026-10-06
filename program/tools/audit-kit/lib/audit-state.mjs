// Own the shared mock for a complete flow; restore the exact uncommitted site state on failure.
import fs from 'node:fs';
import path from 'node:path';
import {mock} from './mock.mjs';
import {WORKSPACE} from './suite.mjs';
export async function auditState(name) {
 const release=await mock.lock(name);
 const app=path.join(WORKSPACE,'orgtik-website/landing-directions');
 const files=['src/content/snapshot.js','vercel.json'].map(f=>[path.join(app,f),fs.readFileSync(path.join(app,f))]);
 const restoreFiles=()=>{for(const [f,bytes] of files)fs.writeFileSync(f,bytes);};
 const filesMatch=()=>files.every(([f,bytes])=>fs.readFileSync(f).equals(bytes));
 // Synchronous fallback if a browser or child process exits unexpectedly.
 const onExit=()=>{restoreFiles();release();};process.once('exit',onExit);
 return {restoreFiles,filesMatch,async cleanup(){try{await mock.reset();}finally{restoreFiles();release();process.removeListener('exit',onExit);}}};
}
