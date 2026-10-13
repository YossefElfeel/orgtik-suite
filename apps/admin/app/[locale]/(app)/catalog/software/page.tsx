import { SoftwareCatalog } from '@/components/console/SoftwareCatalog';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="tools:view"><SoftwareCatalog /></RequirePermission>; }
