import { StaffInvitations } from '@/components/console/StaffInvitations';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="staff:view"><StaffInvitations /></RequirePermission>; }
