// Shared active-app lint. Existing debt is explicit; new diagnostics fail CI.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(path.join(root, 'apps/files/package.json'));
const { Linter } = require('eslint');
const nextRequire = createRequire(require.resolve('eslint-config-next'));
const { parser, plugin: ts } = nextRequire('typescript-eslint');
const hooks = nextRequire('eslint-plugin-react-hooks');
const linter = new Linter();
const active = ['admin','chats','files','hr','marketing','sales','sos','tasks','wm','website/landing-directions'];
const app = process.argv.find(arg => arg.startsWith('--app='))?.slice(6);
if (app && !active.includes(app)) throw Error('Choose an active app.');
const baselineMode = process.argv.includes('--baseline');
if (baselineMode && process.env.CI) throw Error('CI cannot replace the lint baseline.');
const config = [{ files: ['**/*.{js,jsx,ts,tsx}'], languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { '@typescript-eslint': ts, 'react-hooks': hooks }, rules: {
  'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-unsafe-finally': 'error', 'no-fallthrough': 'error', 'valid-typeof': 'error',
  '@typescript-eslint/no-explicit-any': 'error', 'react-hooks/rules-of-hooks': 'error',
} }];
const list = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64e6 }).split('\0').filter(file => active.some(key => file.startsWith(`apps/${key}/`)) && (!app || file.startsWith(`apps/${app}/`)) && /\.(js|jsx|ts|tsx)$/.test(file) && !/\/(node_modules|dist|\.next|qa)\/|next-env\.d\.ts$/.test(file));
const ledgerFile = path.join(root,'tools/ci/lint-baseline.json');
const debt = baselineMode ? {} : JSON.parse(fs.readFileSync(ledgerFile,'utf8')).findings;
const findings = {}, failures = [];
let files = 0, existing = 0;
for (const file of [...new Set(list)].sort()) {
  let source;
  try { source = baselineMode ? execFileSync('git',['show',`72a68708:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:8e6}) : fs.readFileSync(path.join(root,file),'utf8'); } catch { continue; }
  files++;
  const rows = linter.verify(source,config,{filename:file});
  for (const row of rows) {
    const key = `${file} | ${row.ruleId || 'parse'} | ${row.message}`;
    findings[key] = (findings[key] || 0) + 1;
    if (!baselineMode && findings[key] > (debt[key] || 0)) failures.push(`${file}:${row.line}:${row.column} ${row.ruleId || 'parse'} ${row.message}`);
    else existing++;
  }
}
if (baselineMode) { fs.writeFileSync(ledgerFile,JSON.stringify({ base:'72a68708', description:'Pre-existing diagnostics only; remove entries when their source is fixed.', findings },null,2)+'\n'); console.log(`Recorded ${existing} pre-existing diagnostics.`); }
else { console.log(`Lint: ${files} files; ${existing} existing diagnostics; ${failures.length} new diagnostics.`); if(failures.length){console.error(failures.join('\n'));process.exitCode=1;} }
