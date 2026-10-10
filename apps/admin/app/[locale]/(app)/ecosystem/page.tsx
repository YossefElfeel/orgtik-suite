import { Ecosystem } from '@/components/console/Ecosystem';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="workspaces:view"><Ecosystem /></RequirePermission>; }
