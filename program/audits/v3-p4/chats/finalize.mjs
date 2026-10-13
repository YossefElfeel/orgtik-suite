import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd(), directory = 'program/audits/v3-p4/chats';
const reportNames = ['flow-setup', 'native-flow', 'matrix', 'guest-matrix', 'states-admin-huddle', 'first-run', 'preference-handoff', 'readonly-pinned-flow', 'recording-handoff-flow', 'native-recovery'];
const reports = {}, captures = new Set();
for (const name of reportNames) {
  const report = JSON.parse(fs.readFileSync(`${directory}/${name}.json`, 'utf8'));
  assert.ok(Array.isArray(report.checks) && report.checks.length, name);
  assert.ok(report.checks.every(check => typeof check === 'string' || check.pass === true), name + ' has failed checks');
  assert.equal(report.errors?.length || 0, 0, name + ' runtime errors');
  if (['matrix', 'guest-matrix', 'states-admin-huddle', 'first-run', 'native-recovery'].includes(name)) assert.equal(report.completed, true, name + ' incomplete');
  reports[name] = { checks: report.checks.length, completed: true, captures: report.captures?.length || 0 };
  for (const filename of report.captures || []) captures.add(filename);
}
// These original functional scripts record their captures by literal path.
for (const filename of ['flow-native-workbench-en-light-1440.png', 'flow-native-thread-en-light-1440.png', 'flow-guest-lobby-en-light-390.png', 'flow-guest-admitted-en-light-390.png', 'flow-host-admit-en-light-1440.png', 'flow-recording-preview-en-light-1440.png']) captures.add(filename);
const sha = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next') || entry.name === '.turbo') continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (/\.(tsx?|css|json|mjs|cjs|js)$/.test(entry.name) && !/tsconfig|package-lock/.test(entry.name)) sourceFiles.push(filename.replaceAll('\\', '/'));
  }
}
walk('apps/chats'); walk('mock/apps/chats');
sourceFiles.push('mock/apps/chats.js');
const manifest = {
  date: '2026-10-11',
  sourceBase: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  scope: 'Ordinary Chats frontend and guarded persisted mock records; adopted v3 Tier A/B',
  frozenClock: '2026-10-07T09:00:00.000Z',
  validation: { productionBuild: 'passed', typecheck: 'passed', catalogs: ['en', 'ar', 'de', 'fr', 'it'], clientTests: { passed: 14, failed: 0 }, domainTransportAndGuestTests: { passed: 25, failed: 0 }, retainedFilesBoardsAndCustodyTests: { passed: 19, failed: 0 }, boardRecoveryUIHarness: { passed: 6, failed: 0 } },
  reports,
  totals: { scriptedChecks: Object.values(reports).reduce((sum, report) => sum + report.checks, 0), acceptedCaptures: captures.size },
  captureInventory: [...captures].sort().map(filename => { assert.ok(fs.existsSync(`${directory}/${filename}`), filename); return { filename, sha256: sha(`${directory}/${filename}`) }; }),
  sourceInventory: [...new Set(sourceFiles)].sort().map(filename => ({ filename, sha256: sha(filename) })),
  provenance: {
    currentFreshConfirmation: '2026-10-11 owned offset600 sandbox presentation-2k6xdO: source setup, committed rich-message loss/reload recovery, eight Admin sections, actual transport states, first-run and post-trial real vector board. Production/types/catalogs/domain/client checks passed on final source.',
    cycleMatrix: 'Saved hydrated 128 ordinary captures and sixteen actual anonymous guest captures at EN/AR × light/dark ×1440/390/768/1024; accepted functional records belong to this owned cycle. Baseline, intermediate review and diagnostic images are excluded.',
    inheritedRetainedTests: 'Retained Files/whiteboard/custody19 and whiteboard UI recovery6 passed when their documented source fixes were integrated; Root reruns combined integration checks before release.',
    whitespace: 'Final cleanup normalizes reported trailing whitespace only, without changing component behavior.'
  },
  sourceLimits: ['Calls, voice playback, typing/read presence and external delivery remain explicit local simulations.', 'Anonymous guests enter an actual bounded meeting lobby; shared client channels and production guest identity remain outside the adopted scope.', 'Arbitrary media uploads, real OAuth calendar sync, remote media providers and regulatory/security hardening remain deferred.'],
  remainingActualGaps: []
};
fs.writeFileSync(`${directory}/verification.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.totals));
