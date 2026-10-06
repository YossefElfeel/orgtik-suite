"use client";
import { CalendarBlank as Calendar, CalendarDots as CalendarDays, ChatCircle as MessageCircle, DotsThreeVertical as MoreVertical, Paperclip, Pen, Trash } from "@phosphor-icons/react";
import CircularProgress from "@/components/shared/CircularProgress";
import Link from "next/link";
// The board is in Tasks: opened through SOS with a one-time code, landing on this project.
import { SOS_URL } from "@somion/sos-bar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatusCell from "@/components/shared/Table/Cells/StatusCell";
import StatusBadge from "@/components/shared/StatusBadge";
import { IProjects } from "@/types/projects";
import { useTranslations } from "next-intl";

function ProjectCard({ project }: { project: IProjects }) {
  const t = useTranslations("projectCard");
  return (
    <div
      key={project.id}
      className="border bg-raised border-line p-3 rounded-[8px]"
    >
      {/* Project title + description */}
      <div className="border-b border-line">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <Link
            href={`${SOS_URL}/go/task_manager?redirect=${encodeURIComponent(`/projects/${project.id}/board`)}`}
          >
            <h3 className="text-[16px] text-fg font-medium">
              <bdi>{project.title}</bdi>
            </h3>
          </Link>
        </div>
        <p dir="auto" className="text-body-lg text-secondary mt-2">{project.description}</p>

        {/* Circular progress */}
        <div className="flex items-center gap-2 mb-3 mt-2">
          <div className="text-center">
            <CircularProgress
              value={project.progress}
              size={40}
              strokeWidth={5}
              variant="default"
            />
          </div>
          <span className="text-sm text-fg ">
            {t("progressComplete", { progress: project.progress })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center justify-between">
          <CalendarDays className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary ms-1">{project.date}</span>
        </div>
        <div className="flex items-center gap-[14px] text-fg">
          <span className="flex items-center gap-1 text-sm ">
            <Paperclip className="w-3 h-3" />
            {project.totalAttachmentsCount}
          </span>
          <span className="flex items-center gap-1 text-sm">
            <MessageCircle className="w-3 h-3" />
            {project.totalCommentsCount}
          </span>
        </div>
      </div>

      {/* Bottom card: Avatars + Stats */}
      <div className="flex justify-between items-center mt-1">
        <div className="flex justify-between items-center mt-3">
          <div className="flex -space-x-2">
            <TooltipProvider>
              {project.teams.slice(0, 3).map((team) => (
                <Tooltip key={team.id}>
                  <TooltipTrigger render={<span />}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={team.teamImage || "https://github.com/shadcn.png"}
                        alt={team.name}
                      />
                      <AvatarFallback>{team.name[0]}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <bdi>{team.name}</bdi>
                  </TooltipContent>
                </Tooltip>
              ))}

              {project.teams.length > 3 && (
                <Tooltip>
                  <TooltipTrigger render={<span />}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        +{project.teams.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <bdi>
                      {project.teams
                        .slice(3)
                        .map((t) => t.name)
                        .join(", ")}
                    </bdi>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
        <StatusBadge
          status={project.status}
          size="lg"
          className="h-8! rounded-lg!"
        />
      </div>
    </div>
  );
}

export default ProjectCard;
