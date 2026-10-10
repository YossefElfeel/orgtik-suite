import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parseCsv } from './reconcile-v3.mjs';

const directory = 'program/audits/v3-p5';
const input = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const relative = filename => path.relative(directory, filename).replaceAll('\\', '/');
const criteria = parseCsv(fs.readFileSync(`${directory}/criterion-dispositions.csv`, 'utf8')).rows;
assert.equal(criteria.length, 407);
const sources = [
  ['Tasks', 'program/audits/v3-p4-tasks/manifest.json', '111 checks /31 captures', 'فلاتر وقوالب ومواعيد وFiles ومشاريع حقيقية؛ حالات وAdmin وfirst-run.', 'program/audits/v3-p4-tasks/README.md'],
  ['Account', 'program/audits/v3-p4-account/manifest.json', '142 checks /44 captures', 'Home تكيّفي، أشخاص وصلاحيات وusage وaudit وتفضيلات وفوترة محفوظة.', 'program/audits/v3-p4-account/README.md'],
  ['HR', 'program/audits/v3-p4/hr/verification.json', '450 checks /117 captures +focused11/2', 'Self-service وحضور ومراجعات وتوظيف وإجازات ومهام Tasks فعلية.', 'program/audits/v3-p4/hr/README.md'],
  ['CRM', 'program/audits/v3-p4-crm/depth-report.json', '1,316 checks /334 captures', 'Contacts وشركات وpipeline وخدمات ونشر وتسليم وworkspace للعميل الفعلي.', 'program/audits/v3-p4-crm/README.md'],
  ['Chats', 'program/audits/v3-p4/chats/verification.json', '673 checks /171 captures', 'رسائل محفوظة، original-operation recovery، مهمات فعلية، Guests ونسخ Files وvector boards.', 'program/audits/v3-p4/chats/README.md'],
  ['Files', 'program/audits/v3-p4-files/manifest.json', '135 checks /77 captures', 'Bytes وversions وصلاحيات وcomments وquota وsample request links فعلية.', 'program/audits/v3-p4-files/README.md'],
  ['Marketing', 'program/audits/v3-p4-marketing/acceptance.json', '1,927 checks /504 captures', 'CRM consent ونتائج فعلية، email/social محلي، journey Tasks وUTM وrecovery.', 'program/audits/v3-p4-marketing/README.md'],
  ['OrgTik Console', 'program/audits/v3-p4-console/verification.json', null, 'عمليات فوترة محفوظة، line واحد، PDF/pay link، invitations وView as وJ20.', 'program/audits/v3-p4-console/README.md'],
  ['Website Manager', 'program/audits/v3-p4-wm/manifest.json', '554 assertions /135 captures', 'CMS ونشر وautosave/comments/releases، staff وسجلات ومرايات وروابط المالك الحقيقي.', 'program/audits/v3-p4-wm/README.md']
];
const tools = sources.map(([name, manifest, verification, behavior, evidence]) => {
  assert.ok(fs.existsSync(manifest), name + ' final evidence is missing');
  const data = input(manifest);
  if (!verification) {
    const count = data.counts?.acceptedChecks ?? data.totals?.scriptedChecks ?? data.totals?.browserChecks ?? data.browserAssertions ?? data.scriptedChecks;
    const captures = data.counts?.uniqueAcceptedCaptures ?? data.totals?.acceptedCaptures ?? data.acceptedCaptures?.length ?? data.acceptedCaptures;
    assert.ok(Number.isFinite(count) && Number.isFinite(captures), name + ' explicit accepted totals are missing');
    verification = count + ' checks /' + captures + ' captures';
  }
  return { name, manifest, manifestSha256: crypto.createHash('sha256').update(fs.readFileSync(manifest)).digest('hex'), verification, behavior, evidence: relative(evidence) };
});
assert.equal(input('program/audits/v3-p4/chats/verification.json').totals.scriptedChecks, 673);
assert.equal(input('program/audits/v3-p4-marketing/acceptance.json').browserAssertions, 1927);
assert.equal(input('program/audits/v3-p4-wm/manifest.json').accepted, true);
const parity = 'program/audits/v3-p3/catalog-parity-review.json';
const data = { scope: 'Completed nine local/frontend/persisted mock tool cycles; current approved-source parity, integration CI and hosted deployment are remaining Root gates.', criteria, tools, parityEvidence: relative(parity), parityStatus: 'الـ parity النهائي على الكود الموافق عليه لسه بوابة الدمج عند Root. الدليل السابق مربوط بنسخته، ومش ادعاء إن المقارنة الجديدة خلصت.' };
fs.writeFileSync(`${directory}/handoff-data.json`, JSON.stringify(data, null, 2) + '\n');
const htmlFile = `${directory}/handoff.html`;
let html = fs.readFileSync(htmlFile, 'utf8').replace(/\n  <script type="application\/json" id="handoffData">[\s\S]*?<\/script>/, '');
const embedded = JSON.stringify(data).replaceAll('<', '\\u003c');
html = html.replace('  <script>\n', `  <script type="application/json" id="handoffData">${embedded}</script>\n  <script>\n`);
fs.writeFileSync(htmlFile, html);
console.log({ tools: tools.length, criteria: criteria.length });
