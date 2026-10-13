// Evidence overlay for the 2026-10-09 v3 plan. Historical finding fields stay intact.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROGRAM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATE = '2026-10-09';
export function parseCsv(raw) {
  const rows = []; let row = [], field = '', quoted = false;
  raw = raw.replace(/^\uFEFF/, '');
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (quoted) {
      if (ch === '"' && raw[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (quoted) throw Error('Unclosed CSV field');
  if (field || row.length) { row.push(field); rows.push(row); }
  const [columns, ...data] = rows;
  return { columns, rows: data.map(cells => {
    if (cells.length !== columns.length) throw Error(`CSV column mismatch: ${cells[0]}`);
    return Object.fromEntries(columns.map((column, i) => [column, cells[i]]));
  }) };
}
export function writeCsv(columns, rows) {
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(key => quote(row[key])).join(','))].join('\n') + '\n';
}
const review = {
  'SR-001': ['implemented_mock_bounded', 'R1-CONTEXT;R1-ACCESS', 'mock/lib/workspace-context.js; apps/sos/app/go/[scope]/page.tsx; program/decisions/D-068.md', 'V3-P3-ECO'],
  'SR-007': ['implemented_mock_bounded', 'R1-ACCESS', 'mock/lib/workspace-context.js; apps/sos/components/suite/useSuiteApps.tsx; program/decisions/D-068.md', 'V3-P3-ECO'],
  'SR-013': ['implemented_mock_bounded', 'R1-SEATS;R1-MAILBOX', 'mock/lib/workspace-people.js; apps/sos/app/auth/invite/page.tsx; program/phase-f/amendment-A13.md', 'V3-P4-ACCOUNT'],
  'SR-014': ['implemented_mock_bounded', 'R1-CONTEXT;R1-SEATS', 'mock/lib/workspace-context.js; mock/lib/workspace-people.js; program/decisions/D-068.md', 'V3-P3-ECO'],
  'SR-015': ['implemented_mock_bounded', 'R1-STORE-TASKS;R1-STORE-FILES;R1-STORE-HR;R1-STORE-SALES;R1-STORE-MARKETING;R1-STORE-CHATS', 'mock/lib/workspace-runtime.js; mock/lib/workspace-boundary.js; program/decisions/D-068.md', 'V3-P3-ECO'],
  'SR-016': ['implemented_guard_ui_gap', 'R1-ACCESS;R1-BILLING', 'mock/lib/workspace-boundary.js; mock/lib/workspace-context.js; program/decisions/D-068.md; program/plan-v3-execution.md:E5', 'V3-P3-ECO'],
  'SR-019': ['implemented_mock_bounded', 'R1-HR', 'mock/lib/workspace-hr.js; mock/lib/workspace-custody.js; program/phase-f/amendment-A13.md', 'V3-P4-HR'],
  'SR-020': ['implemented_reference_scope_broader_pending', 'R2-FILES', 'mock/lib/workspace-file-references.js; mock/lib/workspace-files.js; program/decisions/D-071.md; program/decisions/D-072.md', 'V3-P3-ECO'],
  'SR-021': ['implemented_persistence_live_delivery_deferred', 'R1-STORE-CHATS;R2-CHATS', 'mock/lib/tool-adapters/chats.js; mock/lib/workspace-runtime.js; program/decisions/D-068.md', 'V3-P4-CHATS'],
  'SR-023': ['implemented_mock_bounded', 'R2-CMS', 'apps/website/landing-directions/src/content/index.js; program/audits/cms-publishing/README.md; program/phase-f/amendment-A20.md', 'V3-P4-WM'],
  'SR-003': ['implemented_mock_bounded', 'R0-OFFERS;R0-PRICING', 'mock/apps/admin/website-offers.js; program/decisions/D-058.md; program/decisions/D-064.md', 'V3-P3-CATALOG'],
  'SR-017': ['implemented_catalog_expansion_pending', 'R0-OFFERS;R2-CATALOG;R4-LAUNCH', 'mock/apps/admin/website-offers.js; program/decisions/D-058.md; program/plan-v3-execution.md:J20', 'V3-P3-CONSOLE'],
  'SR-009': ['resolved_decision_delivery_move_pending', 'RD-WORKORDER;R4-SUPPORT', 'program/decisions/D-059.md; mock/apps/admin/website-managed-service.test.js; program/decisions/D-079.md', 'V3-P3-CATALOG'],
  'SR-008': ['deferred_website_design_scope', 'R2-CATALOG', 'program/plan-v3-execution.md:SR-008; program/decisions/D-077.md', 'V3-P4-ACCOUNT'],
  'SR-018': ['presentation_only_migration_pending', 'R2-CRM', 'mock/lib/presentation.js; mock/server.js:crm_intake_pending; program/decisions/D-079.md', 'V3-P3-CATALOG'],
  'SR-022': ['presentation_only_migration_pending', 'R2-ATTRIBUTION', 'mock/lib/presentation.js; program/prototype-feature-map.md; program/decisions/D-076.md', 'V3-P3-ECO'],
  'SR-024': ['presentation_only_migration_pending', 'R2-PREFS', 'packages/ui/src/prototype/preferences.ts; program/decisions/D-075.md', 'V3-P3-ECO'],
  'SR-025': ['presentation_only_migration_pending', 'R2-NOTIFY', 'mock/lib/presentation.js; program/decisions/D-076.md', 'V3-P3-ECO'],
  'SR-026': ['presentation_only_migration_pending', 'R2-SEARCH', 'mock/lib/presentation.js; program/decisions/D-076.md', 'V3-P3-ECO'],
};
for (const id of ['SR-002', 'SR-004', 'SR-005', 'SR-006', 'SR-010', 'SR-011', 'SR-012']) {
  review[id] = ['implemented_local_acceptance_bounded', 'R0-UX', 'program/audits/r0-prototype/readout.md; program/backlog/release-packages.csv:R0-UX', 'V3-P4-ACCOUNT'];
}

// Topic links route a finding to its delivery owner; they do not accept its full criterion.
const topics = [
  [/files.*(attach|sharing)|attach.*files|whiteboard/i, 'R2-FILES'],
  [/notifications?|mentions?/i, 'R2-NOTIFY'], [/search/i, 'R2-SEARCH'],
  [/invite|ownership|seats?|member|team|role/i, 'R1-SEATS'],
  [/offboard|hir(e|ing)|suite account/i, 'R1-HR'],
  [/2fa|two.factor/i, 'R3-2FA'], [/audit/i, 'R3-AUDIT'],
  [/usage|limits?|quota/i, 'R3-LIMITS'], [/onboarding/i, 'R4-ONBOARDING'],
  [/invoice|refund|credit note|billing contact/i, 'R4-INVOICES'],
  [/dunning|card.*expir|retry|past.due/i, 'R4-DUNNING'], [/pay.by.link/i, 'R4-PAYLINKS'],
  [/tax|vat|zatca/i, 'R4-TAX'], [/mrr|cohort|saas metric/i, 'R4-METRICS'],
  [/support|ticket|sla/i, 'R4-SUPPORT'], [/coming.soon|beta|waitlist|launch/i, 'R4-LAUNCH'],
  [/price|coupon|discount|currency|pricing|checkout|payment/i, 'R0-PRICING'],
  [/publish|website.*content/i, 'R2-CMS'], [/lead|attribution|campaign.*crm/i, 'R2-CRM'],
];
const v3Tool = { tasks: 'TASKS', sos: 'ACCOUNT', usr: 'ACCOUNT', hr: 'HR', sales: 'CRM', chats: 'CHATS', files: 'FILES', marketing: 'MARKETING', adm: 'CONSOLE', admin: 'CONSOLE', wm: 'WM' };
function classify(row) {
  if (review[row.id]) {
    const [status, release_packages, status_evidence, v3_package] = review[row.id];
    return { status, release_packages, status_evidence, v3_package, mapping_basis: 'reviewed_finding', verified_at: DATE };
  }
  const title = `${row.title} ${row.ref}`, topic = topics.find(([pattern]) => pattern.test(title));
  const app = row.apps.split(/[,+ ]+/).find(app => v3Tool[app]);
  return {
    status: 'criterion_recheck_pending',
    release_packages: topic?.[1] || 'CLOSE-EVIDENCE',
    mapping_basis: topic ? 'topic_candidate_not_full_coverage' : 'reconciliation_only',
    status_evidence: 'program/plan-v3-execution.md; program/v3-feasibility.md; original criterion retained; not individually reaccepted',
    verified_at: '',
    v3_package: app ? `V3-P4-${v3Tool[app]}` : 'V3-P5',
  };
}

const packages = [
  ['V3-P0', 'P0', 'Team report, decisions and backlog reconciliation', '', 'program'],
  ['V3-P1', 'P1', 'DS v2 foundations and three real specimens; G-DS1', 'V3-P0', 'library'],
  ['V3-P2', 'P2', 'Library, SuiteFrame, connected/admin primitives; G-DS2', 'V3-P1', 'library'],
  ['V3-P3-ECO', 'P3', 'Workspace connectors, owner-domain journeys, search and adaptive entry', 'V3-P2', 'ecosystem'],
  ['V3-P3-CATALOG', 'P3', 'CRM service catalog, delivery, WM mirrors and website data parity; J19', 'V3-P2;V3-P3-ECO', 'catalog'],
  ['V3-P3-CONSOLE', 'P3', 'Software-only SaaS Console and tool lifecycle; J20', 'V3-P2;V3-P3-ECO', 'console'],
];
const order = ['TASKS', 'ACCOUNT', 'HR', 'CRM', 'CHATS', 'FILES', 'MARKETING', 'CONSOLE', 'WM'];
for (let i = 0; i < order.length; i++) packages.push([
  `V3-P4-${order[i]}`, 'P4', `${order[i]} ordinary screens, admin, onboarding and approved Tier A/B`,
  i ? 'V3-P4-TASKS' : 'V3-P3-ECO;V3-P3-CATALOG;V3-P3-CONSOLE', order[i].toLowerCase(),
]);
packages.push(['V3-P5', 'P5', 'Suite consistency, ordinary journeys J1-J20 and before/after handoff', order.map(tool => `V3-P4-${tool}`).join(';'), 'integration']);

export function reconcileV3({ check = false } = {}) {
  const progressFile = path.join(PROGRAM, 'v3-progress.json');
  const progress = fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, 'utf8')) : { packages: {} };
  const backlogFile = path.join(PROGRAM, 'backlog/backlog.csv');
  const releaseFile = path.join(PROGRAM, 'backlog/release-packages.csv');
  const backlog = parseCsv(fs.readFileSync(backlogFile, 'utf8'));
  const release = parseCsv(fs.readFileSync(releaseFile, 'utf8'));
  const historical = release.rows.filter(row => !row.id.startsWith('V3-'));
  if (historical.length !== 129 || backlog.rows.length !== 407) throw Error('Historical register counts changed; review the v3 migration before regenerating.');
  const newPackages = packages.map(([id, phase, title, depends_on, owner]) => ({
    id, release: `V3-${phase}`, title, depends_on, owner,
    runtime_test_apps: phase === 'P0' ? '' : ({ account: 'sos', crm: 'sales', console: 'admin', library: 'docs', ecosystem: 'sos,tasks,hr,sales,chats,files,marketing', catalog: 'sales,wm,website', integration: 'sos,tasks,hr,sales,chats,files,marketing,admin,wm' }[owner] || owner),
    status: phase === 'P0' ? 'awaiting_owner_report_review' : 'planned_gate_pending',
    delivery_mode: phase === 'P0' ? 'documentation' : 'ordinary_screen_mock_prototype',
    external_deferrals: 'Live providers; arbitrary uploads; regulatory; public Arabic website; deployment without explicit owner instruction',
    current_evidence: 'program/plan-v3-execution.md; program/phase-f/amendment-A37.md',
    acceptance_evidence: '', acceptance: phase === 'P0' ? 'Owner review of program/v3-report.html' : 'Required plan gate, ordinary-route flow and scoped captures',
    code_status_at_presentation_review: 'new_v3_package', ui_status: 'pending', simulation_status: 'planned',
    backend_status: 'existing_foundations_frozen_D073_D075', external_status: 'deferred', local_ui_evidence: '',
    prototype_limitations: 'Approved scope is not implementation or acceptance. Historical evidence remains separately qualified.',
  }));
  release.rows = [...historical, ...newPackages.map(row => ({ ...row, ...(progress.packages?.[row.id] || {}) }))];
  const ids = new Set(release.rows.map(row => row.id));
  if (ids.size !== release.rows.length || new Set(backlog.rows.map(row => row.id)).size !== backlog.rows.length) throw Error('Duplicate register ID');
  const columns = ['status', 'release_packages', 'mapping_basis', 'status_evidence', 'verified_at', 'v3_package'];
  for (const column of columns) if (!backlog.columns.includes(column)) backlog.columns.push(column);
  backlog.rows = backlog.rows.map(row => ({ ...row, ...classify(row) }));
  const criterionFile = path.join(PROGRAM, 'audits/v3-p5/criterion-dispositions.csv');
  let criterionDate = DATE;
  if (fs.existsSync(criterionFile)) {
    const reviewed = parseCsv(fs.readFileSync(criterionFile, 'utf8')).rows;
    const allowed = new Set(['accepted_v3_mock', 'bounded_v3_with_external_deferral', 'retained_contract_rechecked', 'historical_scope_not_adopted', 'superseded_owner_or_policy', 'deferred_tier_c']);
    const byId = new Map(reviewed.map(row => [row.id, row]));
    if (reviewed.length !== 407 || byId.size !== 407) throw Error('P5 criterion review must retain every original ID exactly once.');
    for (const column of ['v3_current_behavior', 'v3_remaining_boundary', 'v3_evidence_checks']) if (!backlog.columns.includes(column)) backlog.columns.push(column);
    backlog.rows = backlog.rows.map(row => {
      const finding = byId.get(row.id);
      if (!finding || finding.title !== row.title || !allowed.has(finding.disposition) || !finding.evidence || !finding.checks || !finding.remaining_boundary || finding.v3_scope !== row.v3_package) throw Error(`Unqualified or changed P5 criterion: ${row.id}`);
      criterionDate = finding.reviewed_at;
      return { ...row, status: finding.disposition, mapping_basis: 'criterion_reviewed_v3', status_evidence: finding.evidence, verified_at: finding.reviewed_at, v3_current_behavior: finding.current_behavior, v3_remaining_boundary: finding.remaining_boundary, v3_evidence_checks: finding.checks };
    });
  }
  for (const row of backlog.rows) {
    for (const id of [...row.release_packages.split(';'), row.v3_package]) if (!ids.has(id)) throw Error(`${row.id} links unknown package ${id}`);
    if (!row.status || !row.status_evidence) throw Error(`${row.id} has no qualified status/evidence`);
  }
  for (const row of release.rows) for (const id of (row.depends_on || '').split(';').filter(Boolean)) {
    if (!ids.has(id)) throw Error(`${row.id} depends on unknown package ${id}`);
  }
  const summaryFile = path.join(PROGRAM, 'backlog/summary.json');
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const by = key => backlog.rows.reduce((counts, row) => { counts[row[key]] = (counts[row[key]] || 0) + 1; return counts; }, {});
  summary.v3 = { reconciled_at: criterionDate, source_revision: progress.source_revision || null, evidence_registry: fs.existsSync(criterionFile) ? 'program/audits/v3-p5/criterion-dispositions.csv' : null, historical_packages: 129, new_packages: packages.length, total_packages: ids.size, byStatus: by('status'), byMappingBasis: by('mapping_basis'), current_gate: progress.current_phase || 'P0_report_review', criterion_note: 'Every P5 finding retains its individual current behavior, evidence checks and remaining boundary. A reviewed finding is not blanket full production acceptance.' };
  const outputs = [[backlogFile, writeCsv(backlog.columns, backlog.rows)], [releaseFile, writeCsv(release.columns, release.rows)], [summaryFile, JSON.stringify(summary, null, 2) + '\n']];
  for (const [file, text] of outputs) {
    if (check) { if (fs.readFileSync(file, 'utf8') !== text) throw Error(`Stale v3 overlay: ${path.relative(PROGRAM, file)}`); }
    else fs.writeFileSync(file, text);
  }
  return { backlog: backlog.rows.length, historicalPackages: historical.length, v3Packages: packages.length, totalPackages: ids.size, statuses: summary.v3.byStatus };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(reconcileV3({ check: process.argv.includes('--check') }), null, 2));
