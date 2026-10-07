import type { AppMe } from '@/redux/features/platform/platformApi';
import type { Team } from '@/redux/features/platform/team';

export type OwnershipTransferDialogProps = { me: AppMe; team: Team };
export type OwnershipTransferRequest = { memberId: string; operationId: string };
export type OwnershipTransferResult = { workspaceId: string; ownerMemberId: string };
export type OwnershipTransferAttempt = OwnershipTransferRequest & { memberName: string; uncertain: boolean };
export type OwnershipTransferValues = { memberId: string };
