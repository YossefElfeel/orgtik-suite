import { readClientSession } from "@orgtik/ui/auth";
export function crmApiScope() { const context=readClientSession()?.workspaceContext;return context?JSON.stringify([context.realm,context.workspace.id,context.actor.userId,context.actor.effectiveUserId,context.actor.readOnly,context.member.accessEpoch]):""; }
