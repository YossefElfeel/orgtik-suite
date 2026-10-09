"use client";

// Every project page's frame: the way back to Projects, the project's name, status and priority,
// its people and teams (managed here by managers), and its three views as tabs. A project that
// doesn't exist or isn't visible says so; the old layout rendered an empty title and an English
// placeholder line. The List view is back (its tab was commented out, TASKS-042).
import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LockKey, MagnifyingGlass, PencilSimple, UserPlus, UsersThree } from "@phosphor-icons/react";
import { Button, ConfirmDialog, EmptyState, ErrorState, MultiSelect, NoPermissionState, PageHeader, Skeleton, Tag } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PageTabs } from "@/components/shared/PageTabs";
import { FormDialog } from "@/components/shared/FormDialog";
import { AvatarStack } from "@/components/shared/AvatarStack";
import PriorityBadge from "@/components/shared/PriorityBadge";
import ProjectStatusBadge from "@/components/shared/ProjectStatusBadge";
import ProjectFormDialog from "@/components/dialogs/projects/ProjectFormDialog";
import { useAddMembersToProjectMutation, useAddTeamsToProjectMutation, useDeleteMembersMutation, useGetProjectByIdQuery, useRemoveTeamsMutation } from "@/redux/features/projects/projectsApi";
import { useGetAllUsersQuery } from "@/redux/features/users/usersApi";
import { useGetTeamsListQuery } from "@/redux/features/teams/teamsApi";
import { useTaskRoles } from "@/lib/permissions";
import { TaskSheet } from "@/components/task/TaskSheet";
import { useArchiveProjectMutation } from "@/redux/features/task/v3Api";

export function useProjectId() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const full = (p: { firstName?: string; lastName?: string }) => `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

function PeopleDialog({ projectId, members }: { projectId: number; members: { id: number; firstName?: string; lastName?: string }[] }) {
  const t = useTranslations("ProjectPage");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const { data } = useGetAllUsersQuery(undefined, { skip: !open });
  const [add] = useAddMembersToProjectMutation();
  const [remove] = useDeleteMembersMutation();
  const memberIds = members.map((m) => m.id);
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      onClosed={() => setPicked([])}
      trigger={
        <Button variant="secondary" startIcon={<UserPlus />}>
          {t("managePeople")}
        </Button>
      }
      title={t("peopleTitle")}
      description={t("peopleHint")}
      submitLabel={t("done")}
      cancelLabel={t("cancel")}
      onSubmit={async () => {
        if (picked.length) await add({ idMembers: projectId, body: { memberIds: picked.map(Number) } }).unwrap();
      }}
    >
      {members.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("inProject")}>
          {members.map((m) => (
            <li key={m.id}>
              <Tag onRemove={() => remove({ projectId, memberId: m.id })}>
                <span dir="auto">{full(m)}</span>
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
      <MultiSelect
        aria-label={t("people")}
        value={picked}
        onValueChange={setPicked}
        placeholder={t("pickPeople")}
        emptyText={t("noOneLeft")}
        options={(data?.data ?? []).filter((u) => !memberIds.includes(u.id)).map((u) => ({ value: String(u.id), label: full(u), hint: u.email }))}
      />
    </FormDialog>
  );
}

function TeamsDialog({ projectId, teamIds }: { projectId: number; teamIds: number[] }) {
  const t = useTranslations("ProjectPage");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const { data } = useGetTeamsListQuery(undefined, { skip: !open });
  const [add] = useAddTeamsToProjectMutation();
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      onClosed={() => setPicked([])}
      trigger={
        <Button variant="secondary" startIcon={<UsersThree />}>
          {t("addTeams")}
        </Button>
      }
      title={t("addTeamsTitle")}
      submitLabel={t("add")}
      cancelLabel={t("cancel")}
      onSubmit={async () => {
        if (!picked.length) throw new Error("empty");
        await add({ projectId, body: { teamIds: picked.map(Number) } }).unwrap();
      }}
    >
      <MultiSelect
        aria-label={t("teams")}
        value={picked}
        onValueChange={setPicked}
        placeholder={t("pickTeams")}
        emptyText={t("noTeamLeft")}
        options={(data?.data ?? []).filter((tm) => !teamIds.includes(tm.id)).map((tm) => ({ value: String(tm.id), label: tm.name }))}
      />
    </FormDialog>
  );
}

export function ProjectFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("ProjectPage");
  const tv = useTranslations("TasksV3");
  const id = useProjectId();
  const { isManager } = useTaskRoles();
  const { data, isLoading, isError, error, refetch } = useGetProjectByIdQuery(id ?? 0, { skip: id == null });
  const [removeTeams] = useRemoveTeamsMutation();
  const [editing, setEditing] = useState(false);
  const [archive, archiving] = useArchiveProjectMutation();
  const status = (error as { status?: number } | undefined)?.status;
  const back = <ButtonLink href="/projects">{t("toProjects")}</ButtonLink>;

  if (id == null || status === 404) return <EmptyState size="page" titleAs="h1" icon={<MagnifyingGlass weight="duotone" />} title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  if (status === 403) return <NoPermissionState size="page" titleAs="h1" icon={<LockKey weight="duotone" />} title={t("noAccessTitle")} description={t("noAccessBody")} action={back} />;
  if (isError) return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} action={back} />;

  const p = data?.data;
  const members = (p?.members ?? []) as unknown as { id: number; firstName?: string; lastName?: string; avatar?: string }[];
  return (
    <section className="flex flex-col gap-6">
      {isLoading || !p ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      ) : (
        <PageHeader
          breadcrumb={[{ label: t("projects"), href: "/projects" }, { label: <bdi>{p.title}</bdi> }]}
          title={<span dir="auto">{p.title}</span>}
          description={p.description ? <span dir="auto" className="hidden sm:inline">{p.description}</span> : undefined}
          status={
            <span className="inline-flex gap-1.5">
              <ProjectStatusBadge status={p.status} size="sm" />
              <PriorityBadge priority={p.priority} size="sm" />
            </span>
          }
          actions={
            isManager ? (
              <><Button variant="secondary" startIcon={<PencilSimple />} disabled={Boolean(p.archivedAt)} onClick={() => setEditing(true)}>
                {t("edit")}
              </Button><ConfirmDialog trigger={<Button variant="secondary" loading={archiving.isLoading}>{tv(p.archivedAt ? "restore" : "archive")}</Button>} title={tv(p.archivedAt ? "restore" : "archive")} impact={tv("archiveImpact")} confirmLabel={tv(p.archivedAt ? "restore" : "archive")} onConfirm={() => archive({ id: id || 0, restore: Boolean(p.archivedAt) }).unwrap()} /></>
            ) : undefined
          }
        />
      )}
      {p ? (
        <div className="hidden flex-wrap items-center gap-x-6 gap-y-3 sm:flex">
          <div className="flex items-center gap-3">
            <span className="text-label text-fg-muted">{t("people")}</span>
            <AvatarStack people={members} max={6} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label text-fg-muted">{t("teams")}</span>
            {p.teams.length ? (
              p.teams.map((team) =>
                isManager && !p.archivedAt ? (
                  <Tag key={team.id} onRemove={() => removeTeams({ projectId: id, teamIds: [team.id] })}>
                    <span dir="auto">{team.name}</span>
                  </Tag>
                ) : (
                  <Tag key={team.id}>
                    <span dir="auto">{team.name}</span>
                  </Tag>
                ),
              )
            ) : (
              <span className="text-caption text-fg-subtle">{t("noTeams")}</span>
            )}
          </div>
          {isManager && !p.archivedAt ? (
            <div className="ms-auto flex flex-wrap gap-2">
              <TeamsDialog projectId={id} teamIds={p.teams.map((x) => x.id)} />
              <PeopleDialog projectId={id} members={members} />
            </div>
          ) : null}
        </div>
      ) : null}
      {p ? <details className="rounded-field border border-line bg-raised p-3 sm:hidden"><summary className="cursor-pointer text-body-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus">{tv("projectDetails")}</summary><div className="mt-3 flex flex-col gap-3">{p.description ? <p dir="auto" className="text-body-sm text-fg-muted">{p.description}</p> : null}<p className="text-caption text-fg-muted">{t("people")} · <bdi>{members.map(person => full(person)).join(" · ")}</bdi></p><p className="text-caption text-fg-muted">{t("teams")} · <bdi>{p.teams.length ? p.teams.map(team => team.name).join(" · ") : t("noTeams")}</bdi></p>{isManager && !p.archivedAt ? <div className="flex flex-wrap gap-2"><PeopleDialog projectId={id || 0} members={members} /><TeamsDialog projectId={id || 0} teamIds={p.teams.map(team => team.id)} /></div> : null}</div></details> : null}
      <PageTabs
        label={t("views")}
        tabs={[
          { href: `/projects/${id}/board`, label: t("tabs.board") },
          { href: `/projects/${id}/lists`, label: t("tabs.lists") },
          { href: `/projects/${id}/calendar`, label: t("tabs.calendar") },
          { href: `/projects/${id}/timeline`, label: tv("timeline") },
        ]}
      />
      {children}
      <TaskSheet projectId={id} />
      {isManager && p ? <ProjectFormDialog projectId={id} open={editing} onOpenChange={setEditing} /> : null}
    </section>
  );
}
