import type { ReactElement } from 'react';

export type EmployeeOffboardingSheetProps = { id: string | number; children?: ReactElement; className?: string };
export type OffboardingAction = 'equipment_returned' | 'final_pay_completed' | 'cancel';
export type OffboardingRecord = {
  id: string; employeeId: number; userId: number; memberId: string | null;
  effectiveAt: string; status: 'scheduled' | 'completed' | 'cancelled';
  transfer: { ownerMemberId: string | null };
  equipment: { status: 'pending' | 'completed' };
  finalPay: { status: 'pending' | 'completed'; currency: string };
  createdAt: string; completedAt?: string;
  actions?: Array<{ action: string; at: string; note?: string | null }>;
};
export type OffboardingOptions = {
  workspace: { id: string; name: string; timeZone: string; state?: string };
  employee: { id: number; name: string; isOwner: boolean };
  canOffboard: boolean; canTrackActions: boolean; successorRequired: boolean;
  successors: Array<{ memberId: string; name: string; email: string; role: string; tools: string[] }>;
  offboarding: OffboardingRecord | null;
  ownershipReview?: { unavailableSuccessorId?: string; departedMemberId?: string } | null;
  staffProtection: { isSuperAdmin: boolean; isLastActiveSuperAdmin: boolean; activeReplacementCount: number; canSchedule: boolean; reason: 'active_super_admin_required' | null } | null;
  staffRecovery: { status: 'required'; offboardingId: string; at: string } | null;
  serverNow: string; businessToday: string;
  custodyCoverage: Array<{ tool: string; assigned: boolean; eligibleSuccessorMemberIds: string[]; canArchive: boolean }>;
};
export type OffboardingValues = { mode: 'now' | 'date'; effectiveDate: string; ownerMemberId: string };
export type OffboardingBody = { effectiveAt?: string; transfer: { ownerMemberId?: string } };
export type OffboardingRequest = { id: string | number; body: OffboardingBody; operationId: string };
export type OffboardingActionBody = { offboardingId: string; action: OffboardingAction; note?: string };
export type OffboardingActionRequest = { id: string | number; body: OffboardingActionBody; operationId: string };
export type OffboardingAttempt = {
  kind: 'offboard'; request: OffboardingRequest; uncertain: boolean;
} | { kind: 'action'; request: OffboardingActionRequest; uncertain: boolean };
export type OffboardingActionValues = { note: string };
