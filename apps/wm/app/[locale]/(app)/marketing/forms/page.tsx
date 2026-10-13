import {RequirePermission} from "@/components/frame/RequirePermission";
import {FormChecks} from "@/components/studio/FormChecks";
export default function Page(){return <RequirePermission permission="marketing:view"><FormChecks/></RequirePermission>;}
