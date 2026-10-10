import { readClientSession } from "@orgtik/ui/auth";
let projectEpoch = 0;
export const advanceMarketingProjectScope = () => {
  projectEpoch++;
};
export const marketingRequestScope = () => {
  const session = readClientSession(),
    context = session?.workspaceContext;
  return JSON.stringify([
    context?.realm,
    context?.workspace.id,
    context?.actor.effectiveUserId,
    context?.actor.readOnly,
    context?.member.accessEpoch,
    context?.tools.marketing?.roles,
    context?.tools.marketing?.access,
    projectEpoch,
  ]);
};
