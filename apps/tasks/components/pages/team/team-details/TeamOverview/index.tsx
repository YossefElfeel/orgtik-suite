"use client";

// A team at a glance (FS-TASKS-11): what it does, its bookmarks, its latest activity and its people.
// Managers add bookmarks and people; everyone else reads. The old page put an unnamed "+" in front
// of people who couldn't use it and an empty "Member online" box.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe, Plus, UserPlus } from "@phosphor-icons/react";
import { Button, Card, CardHeader, EmptyState, LoadingState, MultiSelect } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import AddBookmarkDialog from "@/components/dialogs/teams/AddBookmarkDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { AvatarStack } from "@/components/shared/AvatarStack";
import TaskActivityCard from "@/components/shared/TaskActivityCard";
import { useTeamId } from "@/components/pages/team/TeamFrame";
import { useAddMembersToTeamMutation, useGetTeamDetailsQuery, useGetTeamTaskActivityQuery } from "@/redux/features/teams/teamsApi";
import { useGetAllUsersQuery } from "@/redux/features/users/usersApi";
import { useTaskRoles } from "@/lib/permissions";
import type { ITaskActivity } from "@/types";

function AddPeople({ teamId, current }: { teamId: number; current: number[] }) {
  const t = useTranslations("TeamOverview");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const { data } = useGetAllUsersQuery(undefined, { skip: !open });
  const [addMembers] = useAddMembersToTeamMutation();
  const options = (data?.data ?? []).filter((u) => !current.includes(u.id)).map((u) => ({ value: String(u.id), label: `${u.firstName} ${u.lastName}`, hint: u.email }));
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      onClosed={() => setPicked([])}
      trigger={
        <Button variant="secondary" size="sm" startIcon={<UserPlus />}>
          {t("addPeople")}
        </Button>
      }
      title={t("addPeopleTitle")}
      submitLabel={t("add")}
      cancelLabel={t("cancel")}
      onSubmit={async () => {
        if (!picked.length) throw new Error("empty");
        await addMembers({ id: teamId, memberIds: picked.map(Number) }).unwrap();
      }}
    >
      <MultiSelect aria-label={t("people")} value={picked} onValueChange={setPicked} options={options} placeholder={t("pickPeople")} emptyText={t("noOneLeft")} />
    </FormDialog>
  );
}

export default function TeamOverview() {
  const t = useTranslations("TeamOverview");
  const id = useTeamId() ?? 0;
  const { isManager } = useTaskRoles();
  const { data } = useGetTeamDetailsQuery(id);
  const activity = useGetTeamTaskActivityQuery({ id, page: 1, limit: 3 });
  const team = data?.data;
  const bookmarks = team?.bookmarks ?? [];
  const latest = Object.values(activity.data?.data?.tasks ?? {}).flat().slice(0, 3) as ITaskActivity[];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <Card padding="md" className="flex flex-col gap-3">
          <CardHeader
            title={t("bookmarks")}
            actions={
              isManager ? (
                <AddBookmarkDialog
                  teamId={id}
                  trigger={
                    <Button variant="secondary" size="sm" startIcon={<Plus />}>
                      {t("addBookmark")}
                    </Button>
                  }
                />
              ) : null
            }
          />
          {bookmarks.length ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {bookmarks.map((b) => (
                <li key={b.id}>
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-full items-start gap-3 rounded-card border border-line p-3 hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    <Globe aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-muted" />
                    <span className="flex min-w-0 flex-col">
                      <span dir="auto" className="truncate font-semibold text-fg">
                        {b.title}
                      </span>
                      {b.description ? (
                        <span dir="auto" className="line-clamp-2 text-caption text-fg-muted">
                          {b.description}
                        </span>
                      ) : null}
                      <span dir="ltr" className="truncate text-start text-caption text-fg-subtle">
                        {b.link}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="compact" title={t("noBookmarks")} description={isManager ? t("noBookmarksManager") : t("noBookmarksMember")} />
          )}
        </Card>
        <Card padding="md" className="flex flex-col gap-3">
          <CardHeader
            title={t("latest")}
            actions={
              <Link href={`/teams/${id}/feed`} className="inline-flex items-center gap-1 text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                {t("allActivity")}
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Link>
            }
          />
          {activity.isLoading ? (
            <LoadingState rows={3} />
          ) : latest.length ? (
            <ul className="flex flex-col gap-3">
              {latest.map((a) => (
                <li key={a.id}>
                  <TaskActivityCard TaskActivity={a} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="compact" title={t("noActivity")} />
          )}
        </Card>
      </div>
      <Card padding="md" className="flex h-fit flex-col gap-3">
        <CardHeader title={t("people")} actions={isManager && team ? <AddPeople teamId={id} current={(team.members ?? []).map((m) => m.id)} /> : null} />
        <AvatarStack people={team?.members ?? []} max={8} />
        <Link href={`/teams/${id}/team`} className="text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {t("seeEveryone", { count: team?.members?.length ?? 0 })}
        </Link>
      </Card>
    </div>
  );
}
