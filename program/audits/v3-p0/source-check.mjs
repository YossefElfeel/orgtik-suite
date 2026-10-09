import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseCsv, reconcileV3 } from '../../tools/review/reconcile-v3.mjs';

const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../..');
const read = file => fs.readFileSync(path.join(repo, file), 'utf8');
const tracked = execFileSync('git', ['ls-files'], { cwd: repo, encoding: 'utf8' }).trim().split(/\r?\n/);
const checks = [];
function check(name, pass, evidence) { checks.push({ name, pass: Boolean(pass), evidence }); if (!pass) throw Error(name + ' ' + JSON.stringify(evidence)); }
const backlog = parseCsv(read('program/backlog/backlog.csv'));
const releases = parseCsv(read('program/backlog/release-packages.csv'));
const baselineCsv = file => parseCsv(execFileSync('git', ['show', `c7c7e1f:${file}`], { cwd: repo, encoding: 'utf8' }));
const originalBacklog = baselineCsv('program/backlog/backlog.csv');
const originalRelease = baselineCsv('program/backlog/release-packages.csv');
check('407 original findings and every original field are preserved', originalBacklog.rows.length === 407 && originalBacklog.rows.every((row, i) => originalBacklog.columns.every(column => row[column] === backlog.rows[i]?.[column])), 'baseline c7c7e1f → program/backlog/backlog.csv');
check('129 historical release rows and acceptance fields are unchanged', originalRelease.rows.length === 129 && originalRelease.rows.every((row, i) => originalRelease.columns.every(column => row[column] === releases.rows[i]?.[column])), 'baseline c7c7e1f → program/backlog/release-packages.csv');
const commitments = [...read('program/prototype-feature-map.md').matchAll(/^\| (R3-(?:TASKS|HR|FILES|SALES|MARKETING|CHATS|WM|ADM|USR)-\d{2}) \|/gm)].map(match => match[1]);
check('72 unique historical commitment IDs remain', commitments.length === 72 && new Set(commitments).size === 72, 'program/prototype-feature-map.md (unchanged)');
check('Status overlay and augmented registers regenerate deterministically', Boolean(reconcileV3({ check: true })), 'program/tools/review/reconcile-v3.mjs --check');
for (let id = 75; id <= 80; id++) check(`D-${String(id).padStart(3, '0')} is indexed`, read('program/decisions/README.md').includes(`(D-${String(id).padStart(3, '0')}.md)`), 'program/decisions/README.md');
for (const tool of ['tasks', 'hr', 'sales']) {
  const file = tracked.find(file => file.startsWith(`apps/${tool}/app/`) && file.endsWith('/presentation/page.tsx'));
  const source = read(file);
  check(`${tool} presentation is guarded in ordinary builds`, source.includes('NODE_ENV') && source.includes('NEXT_PUBLIC_DEMO_PANEL') && source.includes('notFound()'), file);
}
check('Workspace command allowlist is a current integration constraint', read('mock/lib/workspace-boundary.js').includes('workspace_command_required') && !read('mock/lib/workspace-boundary.js').includes('chats.task.create'), 'mock/lib/workspace-boundary.js:executeCommand');
check('WM CRM intake is currently deferred', read('mock/server.js').includes("code: 'crm_intake_pending'"), 'mock/server.js:makeCtx');
check('Current tool role catalog contains only Tasks and Files', /const ROLE_NAMES = \{\s*tasks:[\s\S]*?files:[\s\S]*?\n\};/.test(read('mock/lib/workspace-commands.js')), 'mock/lib/workspace-commands.js:ROLE_NAMES');
check('No runtime, website, CI or frozen foundation files changed in P0', execFileSync('git', ['diff', '--name-only', 'c7c7e1f'], { cwd: repo, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean).every(file => file.startsWith('program/')), 'git diff --name-only c7c7e1f');
const newDocs = ['program/v3-report.html', 'program/v3-feasibility.md', 'program/phase-f/amendment-A37.md', 'program/README.md', ...Array.from({ length: 6 }, (_, i) => `program/decisions/D-${String(75 + i).padStart(3, '0')}.md`)];
const badLinks = [];
for (const file of newDocs) {
  const source = read(file), links = file.endsWith('.html') ? [...source.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]) : [...source.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
  for (const link of links) {
    const target = path.resolve(repo, path.dirname(file), link.split('#')[0]);
    if (!/^(?:https?:|#|data:)/.test(link) && target !== path.join(out, 'source-review.json') && !fs.existsSync(target)) badLinks.push({ file, link });
  }
}
check('P0 document links resolve locally', !badLinks.length, badLinks);
const kits = tracked.filter(file => /^apps\/(sales|hr)\/components\/ui\/.*\.(tsx?|jsx?)$/.test(file));
const consumerFiles = tracked.filter(file => /^apps\/(sales|hr)\/.+\.(tsx?|jsx?)$/.test(file));
const kitConsumers = consumerFiles.filter(file => /(?:from\s*['"]|import\(['"])@\/(?:components\/ui|components\/shared\/Table|components\/shared\/StatusBadge)/.test(read(file)));
const allPages = tracked.filter(file => /^apps\/.+\/app\/.+\/page\.tsx$/.test(file));
const report = {
  checked_at: '2026-10-09', source_revision: 'c7c7e1fe6771fe487521c03d48bec5608b0747c1', checks,
  measured: { original_backlog: 407, original_packages: 129, v3_packages: 16, commitments: commitments.length, tracked_page_tsx: allPages.length, sales_hr_ui_kit_files: kits.length, sales_hr_kit_or_local_table_consumers: kitConsumers.length },
  inherited_audit_classification: { presentation_only: 60, ordinary_only: 9, split: 3, real_integration_families: 4, classified_ordinary_routes: 192, note: 'From the supplied plan; not a new exhaustive runtime feature/route audit. Raw tracked routes include auth, redirects and retired surfaces.' },
  acceptance: 'P0 source/document consistency only; real DS v2 specimens, ordinary tool flows and hosted acceptance remain pending',
};
fs.writeFileSync(path.join(out, 'source-review.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checks: checks.length, all_passed: true, measured: report.measured }, null, 2));
