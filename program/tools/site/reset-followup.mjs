import {mock} from '../audit-kit/lib/mock.mjs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const release=await mock.lock('website-followup-reset');
try {
 await mock.reset();
 execFileSync(process.execPath,['scripts/content-pull.mjs'],{cwd:path.resolve(import.meta.dirname,'../../../orgtik-website/landing-directions'),stdio:'inherit'});
} finally {release();}
