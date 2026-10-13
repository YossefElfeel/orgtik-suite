import { Releases } from '@/components/console/Releases';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="tools:view"><Releases /></RequirePermission>; }
