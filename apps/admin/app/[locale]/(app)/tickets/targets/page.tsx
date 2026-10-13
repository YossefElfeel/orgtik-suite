import { TicketTargets } from '@/components/console/TicketTargets';
import { RequirePermission } from '@/components/frame/RequirePermission';
export default function Page() { return <RequirePermission permission="tickets:view"><TicketTargets /></RequirePermission>; }
