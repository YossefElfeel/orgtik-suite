"use client";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { IProject } from "@/types/project";
import { WebsiteLanguages } from "@/constants";
import Link from "next/link";
import { useDeleteProjectMutation } from "@/redux/features/projects/projectsApi";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";

interface ProjectCardProps {
  project: IProject;
  locale: WebsiteLanguages;
}

export default function ProjectCard({ project, locale }: ProjectCardProps) {
  const t = useTranslations("ProjectsPage");
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    handleReqWithToaster(t("deleting_project"), async () => {
      await deleteProject(project.id).unwrap();
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image Section */}
          <div className="md:w-48 shrink-0">
            <div className="relative h-48 md:h-full w-full">
              <Image
                src={project.mainImage?.image || "/placeholder.svg"}
                alt={project.mainImage?.alt || project.title[locale]}
                fill
                className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {project.title[locale]}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                {project.description[locale]}
              </p>

              {/* Tags */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {(project.tags[locale] || []).map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {t("view_project")}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/projects/edit/${project.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      {t("edit")}
                    </Button>
                  </Link>
                  <DeleteConfirmationDialog
                    name="project"
                    onDelete={handleDelete}
                    loading={isDeleting}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DeleteConfirmationDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
