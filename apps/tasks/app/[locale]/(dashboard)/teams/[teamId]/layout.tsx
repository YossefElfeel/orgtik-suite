import { TeamFrame } from "@/components/pages/team/TeamFrame";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <TeamFrame>{children}</TeamFrame>;
}
