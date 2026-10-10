import { TeamView } from "@/components/workspace/team/TeamView";

import { AccountTeamExtras } from "@/components/account/AccountTeamExtras";

export default function TeamPage() {
  return <div className="flex flex-col gap-6"><TeamView /><AccountTeamExtras /></div>;
}
