"use client";

// Pinned folders on the dashboard: open one, or use its menu (unpin is there).
import { useTranslations } from "next-intl";
import { FolderSimple, FolderSimpleUser } from "@phosphor-icons/react";
import { Skeleton } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useGetPinnedFoldersQuery } from "@/redux/features/folder/folderApi";
import FileDropdownMenu from "@/components/shared/FileDropdownMenu";
import { RowActionsButton } from "@/components/shared/RowActionsButton";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useMounted } from "@/hooks/useMounted";

export const PinnedFolders = ({ showTitle = true }: { showTitle?: boolean; variant?: "default" | "small" }) => {
  const t = useTranslations("Dashboard");
  const relative = useRelativeTime();
  // Who's signed in is a browser-only cookie: like the shell, wait for the first client render, so the
  // server's HTML (the placeholder) and the browser's first render match.
  const mounted = useMounted();
  const { data, isLoading: loading } = useGetPinnedFoldersQuery(undefined, { skip: !mounted });
  const isLoading = !mounted || loading;
  const folders = data?.data || [];
  return (
    <section aria-labelledby={showTitle ? "pinned-folders" : undefined} className="flex flex-col gap-2">
      {showTitle ? (
        <h3 id="pinned-folders" className="px-3 pt-3 font-display text-title-sm text-fg">
          {t("pinnedFolders")}
        </h3>
      ) : null}
      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-field" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <p className="px-3 py-6 text-center text-body-sm text-fg-muted">{t("pinnedEmpty")}</p>
      ) : (
        <ul className="flex max-h-[300px] flex-col gap-1 overflow-y-auto px-1 pb-2">
          {folders.map((folder) => {
            const shared = folder.visibility === "everyone" || folder.visibility === "specific_people";
            return (
              <li key={folder.id} className="flex items-center gap-2 rounded-field p-2 hover:bg-hover">
                <Link href={`/my-files/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-field focus-visible:outline-2 focus-visible:outline-focus">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand [&>svg]:size-6">
                    {shared ? <FolderSimpleUser weight="duotone" /> : <FolderSimple weight="duotone" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span dir="auto" className="truncate text-body-sm font-semibold text-fg">
                      {folder.name}
                    </span>
                    <span className="truncate text-caption text-fg-subtle">
                      <bdi>{t("byName", { name: folder.owner?.firstName || t("me") })}</bdi> · {relative(folder.createdAt)}
                    </span>
                  </span>
                </Link>
                <FileDropdownMenu item={{ ...folder, isPinned: true }} type="folder">
                  <RowActionsButton name={folder.name} />
                </FileDropdownMenu>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
