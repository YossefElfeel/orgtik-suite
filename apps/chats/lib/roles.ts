/**
 * SOMION HQ - ROLES AND WHAT THEY MAY DO
 *
 * Roles were in the data model but nothing read them, so every person saw
 * every control. This is the one place that answers "may I?", so a permission
 * is never re-derived - and never quietly re-derived differently - in a
 * component.
 *
 * The rule the whole product follows: a person is never shown a control they
 * cannot use. Disabling it and letting them find out on click is worse, and
 * hiding a whole screen with no explanation is worse still. Where a capability
 * belongs to a role the viewer does not hold, the screen says so in a line.
 */

import type { Role } from "@/entities";
import { msgText } from "@/lib/messages";

export interface Capabilities {
  /** Rename rooms, change capacity, lock them, switch the floor template. */
  manageFloor: boolean;
  /** Change workspace-wide notification, guest and retention policy. */
  manageSettings: boolean;
  /** Create and archive channels. */
  manageChannels: boolean;
  /** Invite guests to a meeting by link. */
  inviteGuests: boolean;
  /** See the team-wide Insights screen at all. */
  viewInsights: boolean;
  /** Start a recording (everyone in the call is still asked). */
  startRecording: boolean;
  /** Rename, archive and unarchive channels. */
  archiveChannels: boolean;
  /** Delete anyone's message; remove anyone from a channel. */
  moderate: boolean;
  /** Reset the workspace to its opening state. Owner only. */
  resetWorkspace: boolean;
}

const MEMBER: Capabilities = {
  manageFloor: false,
  manageSettings: false,
  manageChannels: true,
  inviteGuests: true,
  viewInsights: true,
  startRecording: true,
  archiveChannels: false,
  moderate: false,
  resetWorkspace: false,
};

const ADMIN: Capabilities = {
  ...MEMBER,
  manageFloor: true,
  manageSettings: true,
  archiveChannels: true,
  moderate: true,
};

/* The owner is the one role that can undo everything, which is why there is
   exactly one and an admin cannot remove them. */
const OWNER: Capabilities = {
  ...ADMIN,
  resetWorkspace: true,
};

/**
 * A guest is in one meeting and nothing else. They are deliberately the
 * narrowest role in the product: a client joining a call should not discover
 * the shape of your workspace.
 */
const GUEST: Capabilities = {
  manageFloor: false,
  manageSettings: false,
  manageChannels: false,
  inviteGuests: false,
  viewInsights: false,
  startRecording: false,
  archiveChannels: false,
  moderate: false,
  resetWorkspace: false,
};

export const CAPABILITIES: Record<Role, Capabilities> = {
  owner: OWNER,
  admin: ADMIN,
  member: MEMBER,
  guest: GUEST,
};

/**
 * What a role may do in THIS workspace. The access settings can narrow a
 * member's rights ("only admins may invite guests"); they can never widen a
 * guest's. Every "may I?" in the product goes through here.
 */
export function capabilitiesFor(
  role: Role,
  access: { canCreateChannels: "everyone" | "admins"; canInviteGuests: "everyone" | "admins"; canRecord: "everyone" | "admins" },
): Capabilities {
  const base = CAPABILITIES[role];
  const adminish = role === "admin" || role === "owner";
  return {
    ...base,
    manageChannels: base.manageChannels && (access.canCreateChannels === "everyone" || adminish),
    inviteGuests: base.inviteGuests && (access.canInviteGuests === "everyone" || adminish),
    startRecording: base.startRecording && (access.canRecord === "everyone" || adminish),
  };
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: msgText("role.owner", "Owner"),
  admin: msgText("role.admin", "Admin"),
  member: msgText("role.member", "Member"),
  guest: msgText("role.guest", "Guest"),
};

export const ROLE_BLURB: Record<Role, string> = {
  owner: msgText("role.owner.blurb", "Everything an admin can do, plus resetting the workspace. Cannot be removed by an admin."),
  admin: msgText("role.admin.blurb", "Can change the floor and settings, archive channels, and moderate."),
  member: msgText("role.member.blurb", "The everyday role. Can do their work; cannot change the workspace."),
  guest: msgText("role.guest.blurb", "One meeting, by link. Sees nothing else of the workspace."),
};

export const ROLE_ORDER: Role[] = ["owner", "admin", "member", "guest"];
