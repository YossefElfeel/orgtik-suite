const people = require("./workspace-people");
const { createBusinessCalendar } = require('./business-calendar');
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
function hire({ S, identity, workspace, actor, runtime, payload }) {
  const email = String(payload.email || "").trim().toLowerCase();
  if (!payload.firstName || !payload.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(422, "invalid_employee", "Check the employee name and email.");
  const old = runtime.exportSnapshot().data.employees.find(employee => employee.email.toLowerCase() === email && !employee.deletedAt && employee.status !== "offboarded");
  if (old) throw fail(409, "employee_exists", "This employee already has an employment record.");
  let person = identity.findByEmail(email);
  if (!person) {
    const id = people.allocatePersonId(identity), now = S.iso(S.now());
    person = { id, key: `person_${id}`, email, firstName: String(payload.firstName), lastName: String(payload.lastName), userType: "employee", isActive: false, pendingActivation: true, isEmailVerified: false, authVersion: 0, createdAt: now, updatedAt: now, profile: { language: "en", timeZone: workspace.timeZone, theme: "light" } };
    identity.users.push(person);
  }
  const invitation = people.invite(S, identity, workspace, actor, { email, name: `${payload.firstName} ${payload.lastName}`, tools: payload.tools || ["hr"], role: "member" }, { authorizedHire: true });
  const now = S.iso(S.now());
  const highestCode = Math.max(1000, ...runtime.exportSnapshot().data.employees.map(row => Number(String(row.employeeCode || '').match(/^EMP-(\d+)$/)?.[1]) || 0));
  workspace.nextEmployeeCode = Math.max(workspace.nextEmployeeCode || 1001, highestCode + 1);
  const employeeCode = `EMP-${workspace.nextEmployeeCode++}`;
  const employee = {
    id: person.id, authUserId: person.id, userKey: person.key, employeeCode, firstName: String(payload.firstName), lastName: String(payload.lastName), email,
    phoneNumber: payload.phoneNumber || "", birthday: payload.birthday || "", gender: payload.gender || "", nationality: payload.nationality || "", nationalIdOrPassport: payload.nationalIdOrPassport || "", personalTaxId: payload.personalTaxId || "", accommodationType: payload.accommodationType || "own_accommodation",
    address: { country: payload.country || "", city: payload.city || "", street: payload.street || "", postCode: payload.postCode || "" },
    jobTitle: "", departmentId: null, managerId: null, employeeType: "", workLocation: "", status: "invited", experienceLevel: "", joinDate: now.slice(0, 10), skills: [],
    payment: { paymentMethod: "bank", paymentCycle: "monthly", bank: null, instapay: null, wallet: null },
    salary: { baseSalary: 0, housingAllowanceValue: 0, housingAllowanceType: "percentage", transportationAllowanceValue: 0, transportationAllowanceType: "percentage", otherAllowancesValue: 0, otherAllowancesType: "percentage", insuranceValue: 0, insuranceType: "percentage", taxValue: 0, taxType: "percentage", currency: workspace.currency },
    salaryHistory: [], daysOff: { annualLeave: 0, casualLeave: 0, sickLeave: 0, unpaidLeavePolicy: "", contractAdds: 0 },
    contract: { contractType: "", startDate: "", endDate: null, trainingPeriod: "", noticePeriod: "", sendForSignature: false, companyLogoFileId: null, contractSections: [] },
    permissions: { roleIds: [], scopeDepartmentIds: [], scopeEntityIds: [], customPermissions: [] }, completedSteps: ["user_base_info"], onboardingComplete: false, avatarUrl: "", isActive: false, createdAt: now, updatedAt: now, deletedAt: null,
  };
  runtime.applyCommitted({ kind: "hr.employee.upsert", payload: { employee, person: { id: person.id, key: person.key, firstName: person.firstName, lastName: person.lastName, email } } });
  S.log(actor.key, "employee_hired", String(person.id), { workspaceId: workspace.id, invitationId: invitation.id });
  return { ...employee, invitation };
}
function approveLeave({ S, workspace, actor, runtime, payload }) {
  const snapshot = runtime.exportSnapshot(), request = snapshot.data.timeOffs.find(row => row.id === payload.requestId);
  if (!request) throw fail(404, "leave_not_found", "This leave request was not found.");
  if (!["approved", "rejected", "pending"].includes(payload.status) || request.status === "cancelled") throw fail(422, "invalid_leave_decision", "Check the leave decision.");
  request.status = payload.status; request.decisionNote = payload.decisionNote; request.decidedAt = S.iso(S.now()); request.decidedById = actor.id; request.decidedAs = payload.decidedAs;
  runtime.applyCommitted({ snapshot });
  workspace.approvedLeave ??= [];
  workspace.approvedLeave = workspace.approvedLeave.filter(row => row.requestId !== request.id);
  if (request.status === 'approved') workspace.approvedLeave.push({ requestId: request.id, employeeId: request.employeeId ?? request.userId, startDate: request.startDate, endDate: request.endDate, type: request.type, status: 'approved' });
  S.log(actor.key, "leave_decided", String(request.id), { workspaceId: workspace.id, status: request.status });
  return request;
}
function activateEmployee({ S, runtime, userId }) {
  const snapshot = runtime.exportSnapshot(), employee = snapshot.data.employees.find(row => row.authUserId === userId);
  if (!employee || employee.status !== 'invited') return false;
  employee.status = 'active'; employee.isActive = true; employee.updatedAt = S.iso(S.now());
  runtime.applyCommitted({ snapshot }); return true;
}
function endInstant(workspace, value, now) {
  if (value === undefined || value === null) return now;
  if (typeof value !== 'string') throw fail(422, 'invalid_end_date', 'Choose a valid employment end date.');
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number), calendar = createBusinessCalendar(workspace.timeZone);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    if (normalized.toISOString().slice(0, 10) !== value) throw fail(422, 'invalid_end_date', 'Choose a valid employment end date.');
    // A date-only end date preserves access through the workspace's last local day.
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    return calendar.fromWall({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() });
  }
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) throw fail(422, 'invalid_end_date', 'Choose a valid employment end date.');
  return instant;
}
function offboard({ S, identity, workspace, actor, runtime, payload, transferOwned }) {
  const snapshot = runtime.exportSnapshot(), employee = snapshot.data.employees.find(row => row.id === Number(payload.employeeId));
  if (!employee) throw fail(404, 'employee_not_found', 'This employment record was not found.');
  workspace.offboardings ??= [];
  const existing = workspace.offboardings.find(row => row.employeeId === employee.id && row.status !== 'cancelled');
  if (existing) return existing;
  const person = identity.findUser(employee.authUserId), member = person && people.memberOf(workspace, person);
  const targetId = payload.transfer?.ownerMemberId ?? payload.transfer?.memberId;
  if (member?.role === 'owner' && !workspace.members.some(row => row.id === targetId && row.status === 'active' && row.role !== 'guest' && row.id !== member.id)) throw fail(422, 'ownership_transfer_required', 'Choose an active member to receive workspace ownership.');
  const at = endInstant(workspace, payload.effectiveAt, S.now());
  const row = { id: S.id('offboard'), employeeId: employee.id, userId: employee.authUserId, memberId: member?.id || null, effectiveAt: S.iso(at), status: 'scheduled', transfer: { ownerMemberId: targetId || null }, equipment: { status: 'pending' }, finalPay: { status: 'pending', currency: employee.salary?.currency || workspace.currency }, createdBy: actor.id, createdAt: S.iso(S.now()) };
  workspace.offboardings.push(row);
  S.log(actor.key, 'offboarding_scheduled', row.id, { workspaceId: workspace.id, employeeId: employee.id });
  runOffboarding({ S, workspace, actor, runtime, transferOwned }); return row;
}
function runOffboarding({ S, workspace, actor, runtime, transferOwned }) {
  const completed = [];
  for (const row of workspace.offboardings || []) {
    if (row.status !== 'scheduled' || Date.parse(row.effectiveAt) > S.now()) continue;
    const member = workspace.members.find(item => item.id === row.memberId);
    if (member?.role === 'owner') {
      const target = workspace.members.find(item => item.id === row.transfer.ownerMemberId && item.status === 'active' && item.role !== 'guest');
      if (!target) {
        workspace.state = 'suspended'; workspace.flags ??= {};
        workspace.flags.ownershipReview = { departedMemberId: member.id, unavailableSuccessorId: row.transfer.ownerMemberId, offboardingId: row.id, at: row.effectiveAt };
      } else { target.role = 'owner'; target.revision++; }
      member.role = 'member';
    }
    if (transferOwned) row.custody = transferOwned(row);
    if (member) { member.status = 'offboarded'; member.revision++; member.accessEpoch = (member.accessEpoch || 0) + 1; for (const grant of Object.values(member.toolGrants || {})) grant.assigned = false; }
    for (const invitation of workspace.invitations || []) if (invitation.memberId === row.memberId && invitation.status === 'pending') invitation.status = 'cancelled';
    runtime.applyCommitted({ kind: 'hr.employee.offboard', payload: { employeeId: row.employeeId, effectiveAt: row.effectiveAt } });
    row.status = 'completed'; row.completedAt = row.effectiveAt; people.revision(workspace);
    const owner = workspace.members.find(item => item.role === 'owner' && item.status === 'active');
    people.notice(S, workspace, owner?.email || workspace.billing?.email, 'offboarding_completed', `offboard:${row.id}`, { employeeId: row.employeeId, equipment: row.equipment, finalPay: row.finalPay });
    S.log(actor?.key || 'system', 'employee_offboarded', row.id, { workspaceId: workspace.id, userId: row.userId });
    completed.push(row.userId);
  }
  return { completed };
}
module.exports = { hire, approveLeave, activateEmployee, offboard, runOffboarding, endInstant };
