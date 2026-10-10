"use client";

// Which project (brand) the screens are about. Switching used to leave the previous project's
// lists on screen until each one happened to refetch (MKT-006): now every cached answer is dropped
// and the dashboard of the new project loads. Creating a project is offered only to the roles that
// may (FS-MKT-4), and the new project becomes the active one.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretUpDown, Plus } from "@phosphor-icons/react";
import {
  Avatar,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  Skeleton,
} from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import {
  useGetActiveProjectQuery,
  useGetAllProjectsQuery,
  useSwitchProjectMutation,
} from "@/redux/features/projects/projectApi";
import { ProjectFormDialog } from "@/components/pages/project/ProjectFormDialog";
import { useMarketingRoles } from "@/lib/permissions";
import { isolate } from "@/lib/bidi";
import { advanceMarketingProjectScope } from "@/lib/request-scope";

export function ProjectSwitcher() {
  const t = useTranslations("Shell");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const can = useMarketingRoles();
  const [creating, setCreating] = useState(false);
  const { data: projects, isLoading } = useGetAllProjectsQuery();
  const { data: active } = useGetActiveProjectQuery();
  const [switchProject] = useSwitchProjectMutation();

  const list = projects?.data ?? [];
  const current = active?.data ?? null;

  const choose = async (id: string) => {
    if (!id || id === current?.id) return;
    advanceMarketingProjectScope();
    try {
      await switchProject(id).unwrap();
    } catch {
      return; // the toast says why
    }
    // Nothing from the previous project may stay on screen.
    dispatch(baseApi.util.resetApiState());
    router.push("/dashboard");
  };

  if (isLoading) return <Skeleton className="h-9 w-48 rounded-pill" />;

  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label={
            current
              ? t("switchProjectCurrent", { name: isolate(current.name) })
              : t("chooseProject")
          }
          className="flex h-9 max-w-64 items-center gap-2 rounded-pill border border-line-control bg-raised ps-1 pe-3 text-body text-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          {current ? (
            <Avatar
              name={current.name}
              src={current.avatar}
              size="xs"
              decorative
            />
          ) : null}
          <span
            dir="auto"
            className="min-w-0 flex-1 truncate text-start font-semibold"
          >
            {current ? current.name : t("chooseProject")}
          </span>
          <CaretUpDown aria-hidden className="size-4 shrink-0 text-fg-muted" />
        </MenuTrigger>
        <MenuContent className="w-72">
          {list.length ? (
            <MenuGroup label={t("projects")}>
              <MenuRadioGroup
                value={current?.id ?? ""}
                onValueChange={(v) => void choose(String(v))}
              >
                {list.map((p) => (
                  <MenuRadioItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={p.name}
                        src={p.avatar}
                        size="xs"
                        decorative
                      />
                      <span dir="auto" className="truncate">
                        {p.name}
                      </span>
                    </span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
          ) : (
            <p className="px-3 py-2 text-body text-fg-muted">
              {t("noProjects")}
            </p>
          )}
          {can.manageProjects ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Plus />} onClick={() => setCreating(true)}>
                {t("createProject")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      {can.manageProjects ? (
        <ProjectFormDialog
          open={creating}
          onOpenChange={setCreating}
          onCreated={(id) => void choose(id)}
        />
      ) : null}
    </>
  );
}
