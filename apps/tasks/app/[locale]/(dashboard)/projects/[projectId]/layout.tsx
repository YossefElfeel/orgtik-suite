import { ProjectFrame } from "@/components/pages/projects/ProjectFrame";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <ProjectFrame>{children}</ProjectFrame>;
}
