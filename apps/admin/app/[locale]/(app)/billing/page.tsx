import { BillingOperations } from '@/components/console/BillingOperations';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="billing:view"><BillingOperations /></RequirePermission>; }
