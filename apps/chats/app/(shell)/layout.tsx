import type { ReactNode } from "react";
import { WorkspaceBootstrap } from "@/features/shell/WorkspaceBootstrap";

/**
 * Routes inside (shell) render within the Business OS chrome. The guest page
 * deliberately lives outside this group: a client joining a meeting from a
 * link must never see the suite navigation.
 */
export default function ShellGroupLayout({ children }: { children: ReactNode }) {
  return <WorkspaceBootstrap>{children}</WorkspaceBootstrap>;
}
