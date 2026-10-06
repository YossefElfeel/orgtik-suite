import type { ReactNode } from "react";
import { AppShell } from "@/features/shell/AppShell";
import { HqSidebar } from "@/features/shell/HqSidebar";

export default function HqLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<HqSidebar />}>{children}</AppShell>;
}
