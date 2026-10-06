import type { ReactNode } from "react";
import { AppShell } from "@/features/shell/AppShell";

/**
 * A stand-in for the Task Manager module. It exists so the Discuss button and
 * the presence dot can be demonstrated where they actually live: inside another
 * module, not inside HQ.
 */
export default function TasksLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
