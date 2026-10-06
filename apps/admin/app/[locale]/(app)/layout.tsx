import { AdmFrame } from "@/components/frame/AdmFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AdmFrame>{children}</AdmFrame>;
}
