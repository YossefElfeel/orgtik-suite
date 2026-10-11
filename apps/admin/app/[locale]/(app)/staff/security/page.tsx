import { StaffSecurity } from '@/components/console/StaffSecurity';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="overview:view"><StaffSecurity /></RequirePermission>; }
