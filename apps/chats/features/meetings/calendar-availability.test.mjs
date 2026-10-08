import test from "node:test";
import assert from "node:assert/strict";
import { availabilityNamespace, validateAvailability, workspaceDayKey, workspaceStart } from "../../lib/calendar-availability.ts";
import { validateAvailability as validateTasks, availabilityNamespace as taskNamespace } from "../../../tasks/lib/calendar-availability.ts";

const expected = { workspaceId: "ws_calendar", timeZone: "Europe/Zurich", fromDate: "2026-10-01", toDate: "2026-10-31", namespace: "test", guest: false };
const item = { id: "availability_opaque", personId: 42, personName: "Calendar Person", startDate: "2026-10-25", endDate: "2026-10-25", startAt: "2026-10-24T22:00:00Z", endAt: "2026-10-25T23:00:00Z", durationType: "full_day", halfDayPeriod: null };
const payload = (changes = {}) => ({ workspaceId: expected.workspaceId, timeZone: expected.timeZone, fromDate: expected.fromDate, toDate: expected.toDate, items: [item], ...changes });

for (const [app, validate] of [["Tasks", validateTasks], ["Chats", validateAvailability]]) {
  test(`${app} calendar rejects another context, range, guest projection and invalid civil dates`, () => {
    assert.equal(validate(payload({ workspaceId: "ws_other" }), expected), null);
    assert.equal(validate(payload({ timeZone: "Asia/Dubai" }), expected), null);
    assert.equal(validate(payload({ fromDate: "2026-09-01" }), expected), null);
    assert.equal(validate(payload(), { ...expected, guest: true }), null);
    assert.equal(validate(payload({ items: [{ ...item, startDate: "2026-02-30" }] }), expected), null);
    assert.equal(validate(payload({ items: [{ ...item, endAt: item.startAt }] }), expected), null);
    assert.equal(validate(payload({ items: [item, item] }), expected), null);
    assert.deepEqual(validate(payload({ items: [] }), { ...expected, guest: true }).items, []);
  });
  test(`${app} calendar cache contains no HR notes, type, attachments or write controls`, () => {
    const parsed = validate(payload({ items: [{ ...item, type: "medical", notes: "private", attachments: [{ id: 7 }], employeeId: 91, canApprove: true }] }), expected);
    assert.deepEqual(parsed.items, [item]);
  });
}

test("workspace days and weekly start times ignore browser timezone and retain DST civil hours", () => {
  assert.equal(workspaceDayKey("2026-10-07T22:30:00Z", "Asia/Dubai"), "2026-10-08");
  assert.equal(workspaceDayKey("2026-10-07T22:30:00Z", "America/Los_Angeles"), "2026-10-07");
  assert.equal(workspaceStart("2026-10-18", "09:00", "Europe/Zurich").toISOString(), "2026-10-18T07:00:00.000Z");
  assert.equal(workspaceStart("2026-10-25", "09:00", "Europe/Zurich").toISOString(), "2026-10-25T08:00:00.000Z");
  assert.equal(workspaceStart("2026-10-25", "02:30", "Europe/Zurich").toISOString(), "2026-10-25T00:30:00.000Z");
  assert.throws(() => workspaceStart("2026-03-29", "02:30", "Europe/Zurich"), /missing_workspace_time/);
});

test("calendar namespaces change on workspace, actor, tool role, membership and timezone changes", () => {
  const context = { realm: "test", workspace: { id: "a", timeZone: "Europe/Zurich" }, actor: { effectiveUserId: 1, readOnly: false }, member: { role: "member", revision: 1, accessEpoch: 0 }, tools: { chat: { access: "active", roles: ["member"], canWrite: true }, tasks: { access: "active", roles: ["member"], canWrite: true } } };
  for (const namespace of [availabilityNamespace, taskNamespace]) {
    const original = namespace(context);
    for (const change of [value => value.workspace.id = "b", value => value.actor.effectiveUserId = 2, value => value.member.revision++, value => value.member.accessEpoch++, value => value.workspace.timeZone = "Asia/Dubai", value => { value.tools.tasks.roles = ["guest"]; value.tools.chat.roles = ["guest"]; }]) {
      const next = structuredClone(context); change(next); assert.notEqual(namespace(next), original);
    }
  }
});
