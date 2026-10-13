import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseCsv, writeCsv } from './reconcile-v3.mjs';

const file = 'program/audits/sales/issues.csv', register = parseCsv(fs.readFileSync(file, 'utf8'));
assert.equal(register.rows.length, 191);
const decisions = new Map();
function mark(ids, status, evidence, behavior, boundary) {
  for (const number of ids.split(' ')) {
    const id = 'SAL-' + number.padStart(3, '0');
    assert.ok(!decisions.has(id), id);
    decisions.set(id, { status, v3_evidence: evidence, v3_current_behavior: behavior, v3_remaining_boundary: boundary });
  }
}
const cycle = 'program/audits/v3-p4-crm/README.md';
mark('001', 'implemented_local_bounded', 'apps/sales/app/[locale]/auth/not-allowed/page.tsx; ' + cycle, 'The old developer login/paste-token source is removed; current no-access page renders native guidance and the suite link.', 'This source correction does not certify production identity security.');
mark('002 003 004 005 006 028 030 033 034 035 036 120', 'existing_auth_contract_rechecked', 'apps/sales/lib/suite-navigation.ts; packages/ui/src/auth; mock/lib/workspace-boundary.js; ' + cycle, 'Existing one-use handoff, signed current workspace/person authority, readonly actor and late scope fencing replace the historical role/token UI path.', 'D073 preserves the actual identity/session boundary; no new security-hardening or exhaustive all-route audit is claimed.');
mark('025 132 133 135', 'implemented_local_bounded', 'program/audits/v3-p3-crm/README.md; program/audits/v3-p4-crm/depth-report.json', 'Actual website lead/paid receipt reaches the canonical CRM source; paid review/Start keeps its immutable period, and confirmed won provision stores one actual customer workspace receipt.', 'Payments/signatures/provider invitation remain simulated; unchanged legacy pricing is explicitly compatibility data.');
mark('026 027 024 136', 'superseded_owner_or_policy', 'program/decisions/D-079.md; program/audits/v3-p3-crm/README.md; ' + cycle, 'CRM owns services/publication/delivery, Console owns software, and paid import retains the original website receipt rather than recomputing a legacy deal.', 'Original arbitrary website-to-legacy-plan equivalence is superseded; legacy constructor money semantics remain frozen.');
mark('031 038 041 045 043 046 047 049 051 052 053 055 151 152 153 154 155 158 159 161 163 164', 'implemented_local_bounded', 'program/audits/v3-p4-crm/matrix-report.json; program/audits/v3-p4-crm/home-report.json; program/audits/v3-p4-crm/source-inventory.json; ' + cycle, 'Current ordinary v2 shell, real-person preferences, exact current source feeds, one search/bell, translated catalogs, RTL/themes and shared controls replace the old kit/shell.', 'Acceptance is bounded to the current ordinary matrix/source inventory; not every historical linguistic or interaction subclaim is fully reaccepted.');
mark('014 017 067', 'implemented_local_bounded', 'program/audits/v3-p4-crm/retained-report.json; program/audits/v3-p4-crm/depth-report.json', 'Actual customer counter/accept agrees on the stored amount; recorded signed contract approval and current manager payout denial are proved.', 'Other legacy commission/payment fields and pricing contracts retain their D073 limits.');
mark('059', 'implemented_local_bounded', 'apps/sales/lib/deals/documents.ts; program/audits/v3-p4-crm/depth-report.json', 'Current native PDF reads select authenticated immutable source bytes and verify the current workspace instead of accepting an arbitrary caller URL.', 'No general production document security/conversion provider is certified.');
mark('081', 'implemented_local_bounded', 'program/audits/v3-p4-crm/functional-report.json; ' + cycle, 'Current CRM activity layer uses actual structured notes/logs and source stage/offer/project records.', 'This does not create external call/email delivery or fabricate past historical events.');
mark('039 042 093 094 099 100 102 114 115 116 117 139 181', 'implemented_local_bounded', 'program/audits/v3-p4-crm/states-report.json; program/audits/v3-p4-crm/home-report.json; program/audits/v3-p4-crm/matrix-report.json', 'Actual current create/list/detail callbacks, native empty/error/not-found/readonly states and serious/critical axe checks pass on accepted ordinary routes.', 'Historical every-route/per-role microinteraction claims outside those named checks remain qualified.');
mark('147 148 183 191', 'superseded_retired_source', 'program/audits/v3-p4-crm/kit-cleanup.json; program/audits/v3-p4-crm/source-inventory.json; ' + cycle, 'The exact approved226 retired visual-kit consumers were removed and surviving imports verified; ordinary navigation excludes presentation/demo pages.', 'Unrelated unused business modules and isolated historical reference routes remain intentionally preserved.');

for (const column of ['v3_evidence', 'v3_current_behavior', 'v3_remaining_boundary', 'v3_reviewed_at']) if (!register.columns.includes(column)) register.columns.push(column);
register.rows = register.rows.map(row => {
  const classified = decisions.get(row.id);
  const retired = /frozen|plan-management|\/coupons/.test(row.route);
  return { ...row, ...(classified || {
    status: retired ? 'superseded_retired_ui_contract_frozen' : 'historical_scope_boundary',
    v3_evidence: 'program/decisions/D-073.md; program/decisions/D-079.md; program/plan-v3-execution.md:5.2-5.4; ' + cycle,
    v3_current_behavior: retired ? 'The legacy platform UI owner/path is retired or compatibility-only; current native service/software owners are CRM/Console.' : 'Current native ordinary source and retained contract are documented by the cycle; this original wider requirement is not silently accepted.',
    v3_remaining_boundary: 'Original criterion retained: ' + row.title + '. Its historical repro/evidence is preserved. New security architecture, legacy money/policy changes and unrelated feature expansion are outside the adopted frontend/mock work; a passing package is not full criterion closure.'
  }), v3_reviewed_at: '2026-10-11' };
});
assert.equal(new Set(register.rows.map(row => row.id)).size, 191);
assert.ok(register.rows.every(row => row.v3_evidence && row.v3_remaining_boundary));
fs.writeFileSync(file, writeCsv(register.columns, register.rows));
const statuses = register.rows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {});
fs.writeFileSync('program/audits/v3-p5/crm-issues-reconciliation.json', JSON.stringify({ originalFindings: 191, originalFieldsPreservedExceptStatus: true, specificNativeOrSupersededReviews: decisions.size, counts: statuses, limitation: 'Historical criteria remain visible. Scoped current evidence does not establish full production/security/legacy-policy acceptance.' }, null, 2) + '\n');
console.log({ findings: register.rows.length, statuses });
