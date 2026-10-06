"use client";

import { use } from "react";
import ProjectDetails from "@/components/pages/projects/ProjectDetails";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectDetails id={id} />;
}
