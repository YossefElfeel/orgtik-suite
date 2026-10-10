import { Setup } from '@/components/console/Setup';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="overview:view"><Setup /></RequirePermission>; }
