import { TaxChecks } from '@/components/console/TaxChecks';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="tax:view"><TaxChecks /></RequirePermission>; }
