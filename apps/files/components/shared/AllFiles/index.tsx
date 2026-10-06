"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, Folder, FolderUser } from "@phosphor-icons/react";
import { Avatar, EmptyState, IconButton, ListStates, Pagination, Skeleton, Tooltip, cn, useFormatter } from "@orgtik/ui";
import { Link, usePathname } from "@/i18n/routing";
import FileDropdownMenu from "../FileDropdownMenu";
import { useGetFoldersQuery, useGetPinnedFoldersQuery } from "@/redux/features/folder/folderApi";
import { IFolder, IFolderPinned } from "@/types";
import { usePaginationSearchParams } from "@/hooks/use-pagination-search-params";
import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";

/* VS-1: folders on @orgtik/ui. Each card is a real link (it was a clickable div: no keyboard, no
   "open in new tab"), its menu has a spoken name, dates follow the reader's language, and the
   access avatars overlap with logical margins, so they stack the right way in Arabic. The lists
   load in the browser, so the server renders their placeholder and never a half-filled grid. */
const AllFiles = ({ parentId }: { parentId?: string }) => {
  const t = useTranslations("Folders");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { page, limit, setPage, setLimit } = usePaginationSearchParams({
    pageParam: "folderPage",
    limitParam: "folderLimit",
    defaultLimit: 8,
  });

  const { data: pinnedData } = useGetPinnedFoldersQuery(undefined, { skip: !mounted || Boolean(parentId) });
  const { data, isLoading, isFetching, isError, refetch } = useGetFoldersQuery(
    { page, limit, parentId: parentId || undefined },
    { skip: !mounted },
  );

  const pinned: IFolderPinned[] = pinnedData?.data ?? [];
  const folders: IFolder[] = data?.data?.items ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const status = !mounted || isLoading ? "loading" : isError ? "error" : folders.length === 0 ? "empty" : "ready";

  return (
    <div className="flex flex-col gap-8 pt-5 pb-10">
      {!parentId && pinned.length > 0 ? (
        <section aria-labelledby="pinned-heading" className="flex flex-col gap-4">
          <h2 id="pinned-heading" className="font-display text-title text-fg">
            {t("pinned")}
          </h2>
          <FolderGrid>
            {pinned.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
          </FolderGrid>
        </section>
      ) : null}

      <section aria-labelledby="folders-heading" aria-busy={isFetching || undefined} className="flex flex-col gap-4">
        <h2 id="folders-heading" className="font-display text-title text-fg">
          {parentId ? t("subfolders") : t("all")}
        </h2>
        {status === "loading" ? (
          <FolderGrid>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-card" />
            ))}
          </FolderGrid>
        ) : (
          <ListStates
            status={status}
            size="compact"
            onRetry={refetch}
            empty={{ title: parentId ? t("emptyHere") : t("empty"), description: t("emptyBody"), action: <CreateFolderDialog /> }}
          >
            <FolderGrid className={cn("transition-opacity", isFetching && "opacity-60")}>
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </FolderGrid>
            {total > limit ? (
              <Pagination page={page} pageSize={limit} total={total} pageSizes={[8, 16, 32]} onPageChange={setPage} onPageSizeChange={setLimit} />
            ) : null}
          </ListStates>
        )}
      </section>
    </div>
  );
};

function FolderGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  // Columns follow the space the grid has (not the viewport): at least 15rem each, so a card never
  // gets too narrow for its name, date and avatars, and never pushes the page wider.
  return <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-4", className)}>{children}</div>;
}

const FolderCard = ({ folder }: { folder: IFolder | IFolderPinned }) => {
  const t = useTranslations("Folders");
  const f = useFormatter();
  const pathname = usePathname();
  // Folders nest by path: /my-files/a/b opens b inside a.
  const base = pathname.startsWith("/my-files") ? pathname : "/my-files";
  const people = folder.accessUsers ?? [];

  return (
    <div className="group relative flex min-w-0 items-center gap-3 rounded-card border border-line bg-raised p-3 transition-shadow hover:shadow-raised has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand">
        {folder.visibility === "specific_people" ? <FolderUser weight="duotone" className="size-6" /> : <Folder weight="duotone" className="size-6" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* The link covers the whole card; the menu sits above it. */}
        <Link
          href={`${base}/${folder.id}`}
          title={folder.name}
          dir="auto"
          className="truncate text-start text-body font-semibold text-fg outline-none after:absolute after:inset-0 after:rounded-card"
        >
          {folder.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-caption text-fg-subtle">{f.date(folder.createdAt)}</span>
          {people.length ? (
            <span className="relative z-[1] flex items-center">
              {people.slice(0, 3).map((user, i) => (
                <Tooltip key={user.id} content={`${user.firstName} ${user.lastName}`}>
                  <span tabIndex={0} className={cn("rounded-pill ring-2 ring-raised focus-visible:outline-2 focus-visible:outline-focus", i > 0 && "-ms-2")}>
                    <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatar} size="xs" />
                  </span>
                </Tooltip>
              ))}
              {people.length > 3 ? (
                <Tooltip content={people.slice(3).map((u) => `${u.firstName} ${u.lastName}`).join("، ")}>
                  <span tabIndex={0} dir="ltr" className="-ms-2 grid size-6 place-items-center rounded-pill bg-sunken text-micro text-fg-muted ring-2 ring-raised focus-visible:outline-2 focus-visible:outline-focus">
                    {t("more", { count: people.length - 3 })}
                  </span>
                </Tooltip>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative z-[1]">
        <FileDropdownMenu item={folder} type="folder">
          <IconButton size="sm" label={t("actionsFor", { name: folder.name })} icon={<DotsThreeVertical weight="bold" />} />
        </FileDropdownMenu>
      </div>
    </div>
  );
};

export default AllFiles;
