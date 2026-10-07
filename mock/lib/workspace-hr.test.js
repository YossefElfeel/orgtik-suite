const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeStore } = require('../apps/admin/store');
const { initializeWorkspaceAuthority, seatCounts } = require('./workspace-context');
const hr = require('./workspace-hr');
const people = require('./workspace-people');
function fixture() {
  const owner = { id: 1, key: 'admin', email: 'owner@fixture.test', isActive: true }, employee = { id: 2, key: 'employee', email: 'worker@fixture.test', firstName: 'Existing', lastName: 'Person', isActive: true, passwordHash: 'preserved' };
  const identity = { users: [owner, employee], grants: {}, findUser: id => identity.users.find(row => row.id === Number(id)), findByEmail: email => identity.users.find(row => row.email === email) };
  const S = makeStore({ identity }); let now = Date.parse('2026-10-07T09:00:00Z'); S.now = () => now;
  initializeWorkspaceAuthority(S, identity);
  const ws = S.createWorkspace({ wsId: 'hr-workspace', ownerKey: owner.key, name: 'People', email: owner.email, currency: 'CHF' });
  ws.lines.push({ tool: 'hr', planId: 'hr_pro', state: 'active', snapshot: { quantity: 2 } });
  ws.members[0].toolGrants = { hr: { roles: ['super_admin'], assigned: true } };
  let snapshot = { data: { employees: [], timeOffs: [] }, sequences: {} };
  const runtime = { exportSnapshot: () => structuredClone(snapshot), applyCommitted(command) {
    if (command.snapshot) snapshot = structuredClone(command.snapshot);
    else if (command.kind === 'hr.employee.upsert') snapshot.data.employees.push(structuredClone(command.payload.employee));
    else if (command.kind === 'hr.employee.offboard') Object.assign(snapshot.data.employees.find(row => row.id === command.payload.employeeId), { status: 'offboarded', isActive: false });
  } };
  return { S, identity, workspace: ws, actor: owner, runtime, employee, setNow: value => now = Date.parse(value) };
}
test('hire reuses identity, preserves credentials, reserves invitation and activates employment once', () => {
  const f = fixture(), before = f.identity.users.length;
  const result = hr.hire({ ...f, payload: { firstName: 'Existing', lastName: 'Person', email: f.employee.email } });
  assert.equal(f.identity.users.length, before); assert.equal(f.employee.passwordHash, 'preserved');
  assert.equal(result.status, 'invited'); assert.equal(result.salary.currency, 'CHF'); assert.equal(result.isActive, false);
  assert.equal(seatCounts(f.S, f.workspace, 'hr').reserved, 1);
  const token = f.S.db.mailbox.at(-1).acceptanceToken;
  people.acceptInvitation(f.S, f.identity, token, f.employee, {});
  assert.equal(hr.activateEmployee({ ...f, userId: f.employee.id }), true);
  assert.equal(hr.activateEmployee({ ...f, userId: f.employee.id }), false);
  assert.equal(f.runtime.exportSnapshot().data.employees[0].status, 'active');
});
test('end date keeps access through workspace day, releases seats once and preserves other memberships', () => {
  const f = fixture(); hr.hire({ ...f, payload: { firstName: 'Existing', lastName: 'Person', email: f.employee.email } });
  people.acceptInvitation(f.S, f.identity, f.S.db.mailbox.at(-1).acceptanceToken, f.employee, {});
  hr.activateEmployee({ ...f, userId: f.employee.id });
  const other = f.S.createWorkspace({ wsId: 'other', ownerKey: f.employee.key, name: 'Other', email: f.employee.email });
  const row = hr.offboard({ ...f, payload: { employeeId: f.employee.id, effectiveAt: '2026-10-08' } });
  assert.equal(row.effectiveAt, '2026-10-08T21:00:00.000Z');
  f.setNow('2026-10-08T20:59:59Z'); assert.deepEqual(hr.runOffboarding(f).completed, []);
  assert.equal(people.memberOf(f.workspace, f.employee).status, 'active');
  f.setNow(row.effectiveAt); assert.deepEqual(hr.runOffboarding(f).completed, [2]);
  assert.deepEqual(hr.runOffboarding(f).completed, []);
  assert.equal(seatCounts(f.S, f.workspace, 'hr').assigned, 1);
  assert.equal(other.members[0].status, 'active'); assert.equal(f.employee.isActive, true); assert.equal(f.employee.passwordHash, 'preserved');
  assert.equal(row.equipment.status, 'pending'); assert.equal(row.finalPay.status, 'pending');
});
test('offboarding owner requires a valid replacement before revoking membership', () => {
  const f = fixture(); f.runtime.applyCommitted({ kind: 'hr.employee.upsert', payload: { employee: { id: 1, authUserId: 1, salary: { currency: 'CHF' } } } });
  assert.throws(() => hr.offboard({ ...f, payload: { employeeId: 1 } }), { code: 'ownership_transfer_required' });
  f.workspace.members.push({ id: 'next-owner', userKey: f.employee.key, status: 'active', role: 'member', revision: 1, toolGrants: {} });
  hr.offboard({ ...f, payload: { employeeId: 1, transfer: { ownerMemberId: 'next-owner' } } });
  assert.equal(f.workspace.members[1].role, 'owner'); assert.equal(f.workspace.members[0].status, 'offboarded');
});
test('scheduled offboarding still revokes a departed owner when the proposed successor becomes inactive', () => {
  const f = fixture(); f.runtime.applyCommitted({ kind: 'hr.employee.upsert', payload: { employee: { id: 1, authUserId: 1, salary: { currency: 'CHF' } } } });
  f.workspace.members.push({ id: 'next-owner', userKey: f.employee.key, status: 'active', role: 'member', revision: 1, toolGrants: {} });
  const row = hr.offboard({ ...f, payload: { employeeId: 1, effectiveAt: '2026-10-08', transfer: { ownerMemberId: 'next-owner' } } });
  f.workspace.members[1].status = 'removed'; f.setNow(row.effectiveAt);
  hr.runOffboarding(f);
  assert.equal(f.workspace.state, 'suspended'); assert.equal(f.workspace.members[0].status, 'offboarded');
  assert.equal(f.workspace.flags.ownershipReview.offboardingId, row.id);
});
test('approved leave projection is workspace-scoped and withdrawn on rejection', () => {
  const f = fixture(); const snapshot = f.runtime.exportSnapshot();
  snapshot.data.timeOffs.push({ id: 9, employeeId: 2, startDate: '2026-10-09', endDate: '2026-10-10', status: 'pending', type: 'annual' });
  f.runtime.applyCommitted({ snapshot });
  hr.approveLeave({ ...f, payload: { requestId: 9, status: 'approved' } });
  assert.equal(f.workspace.approvedLeave.length, 1); assert.equal(f.S.workspace('ws_orgtik').approvedLeave, undefined);
  hr.approveLeave({ ...f, payload: { requestId: 9, status: 'rejected' } }); assert.equal(f.workspace.approvedLeave.length, 0);
});
