"use client";
// The team (USR-13/14, spec 05 USR-20): who is in the workspace, with what role and tools, and what
// the seats cost. The owner and admins invite and change people; everyone else reads. The owner's
// own row doesn't change here (ownership moves only by transfer), nor does your own.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, DotsThreeVertical, EnvelopeSimple, Plus, ShieldCheck, SquaresFour, Trash, User, UserMinus } from "@phosphor-icons/react";
import { Avatar, Badge, Button, Card, ConfirmDialog, ErrorState, IconButton, LoadingState, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, PageHeader, Tag, toast, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import useWorkspace from "@/hooks/use-workspace";
import type { AppMe, WorkspaceRole } from "@/redux/features/platform/platformApi";
import { useGetTeamQuery, useUpdateMemberMutation, type Team, type TeamMember } from "@/redux/features/platform/team";
import { useLocalized, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { InviteDialog } from "./InviteDialog";
import { AccessDialog } from "./AccessDialog";
import { linesFor, paysSeat, seatsOn, sumUnits } from "./seats";

type Action = { kind: "role"; role: Exclude<WorkspaceRole, "owner"> } | { kind: "access" } | { kind: "remove" };
const MAX_TOOLS = 2;

export function TeamView() {
  const t = useTranslations("Team");
  const ws = useWorkspace();
  const me = ws.me as AppMe;
  const { data: team, isLoading, isError, refetch } = useGetTeamQuery();
  const [inviting, setInviting] = useState(false);
  const [target, setTarget] = useState<{ member: TeamMember; action: Action } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const columns = useColumns({ me, canManage: ws.isAdmin, onAction: (member, action) => setTarget({ member, action }) });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={ws.isAdmin ? t("description", { name: me.workspace.name }) : t("readOnly", { name: me.workspace.name })}
        actions={
          ws.isAdmin && team ? (
            <Button variant="primary" startIcon={<Plus />} onClick={() => setInviting(true)}>
              {t("invite.open")}
            </Button>
          ) : null
        }
      />
      {problem ? <Notice tone="danger">{problem}</Notice> : null}
      {isLoading ? (
        <LoadingState rows={6} />
      ) : isError || !team ? (
        <ErrorState title={t("failedTitle")} description={t("failedBody")} onRetry={refetch} />
      ) : (
        <>
          <SeatsSummary team={team} me={me} />
          <DataTable
            label={t("tableLabel", { name: me.workspace.name })}
            columns={columns}
            data={team.items}
            getRowId={(m) => m.id}
            paginate={team.items.length > 25}
            empty={{ title: t("emptyTitle"), description: t("emptyBody") }}
          />
          {ws.isAdmin ? <InviteDialog open={inviting} onOpenChange={setInviting} me={me} team={team} /> : null}
          <MemberChange team={team} me={me} target={target} onClose={() => setTarget(null)} onProblem={setProblem} />
        </>
      )}
    </div>
  );
}

function SeatsSummary({ team, me }: { team: Team; me: AppMe }) {
  const t = useTranslations("Team.seats");
  const f = useFormatter();
  const name = useLocalized();
  const { seats, seatModel, perUserLines } = team.meta;
  const guests = team.items.filter((m) => m.role === "guest" && m.status === "active").length;
  const invited = team.items.filter((m) => m.status === "invited").length;
  const toolName = (key: string) => {
    const tool = me.tools.find((x) => x.key === key);
    return tool ? name(tool.name) : key;
  };
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display text-title-sm text-fg">{t("title")}</h2>
          <p className="max-w-prose text-body-sm text-fg-muted">{seatModel === "B" ? t("modelB") : t("modelA")}</p>
        </div>
        <dl className="flex flex-wrap gap-6">
          <div className="flex flex-col">
            <dt className="text-caption text-fg-muted">{t("paid")}</dt>
            <dd className="font-display text-title text-fg tabular-nums">{f.number(seats)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-caption text-fg-muted">{t("guests")}</dt>
            <dd className="font-display text-title text-fg tabular-nums">{f.number(guests)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-caption text-fg-muted">{t("invited")}</dt>
            <dd className="font-display text-title text-fg tabular-nums">{f.number(invited)}</dd>
          </div>
        </dl>
      </div>
      {perUserLines.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-label text-fg">{t("linesTitle")}</h3>
          <ul className="flex flex-col divide-y divide-line rounded-field border border-line">
            {perUserLines.map((l) => {
              const n = seatsOn(l, seatModel, team.items, seats);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-body-sm">
                  <span className="font-semibold text-fg">{toolName(l.tool)}</span>
                  <span className="text-fg-muted">
                    {t("perSeat", { price: f.money(l.unit, l.currency), seats: n })}
                  </span>
                  <span dir="ltr" className="font-semibold text-fg tabular-nums">
                    {f.money(l.unit * n, l.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-caption text-fg-muted">{t("linesNote")}</p>
        </div>
      ) : (
        <p className="text-body-sm text-fg-muted">{t("noLines")}</p>
      )}
    </Card>
  );
}

function useColumns({ me, canManage, onAction }: { me: AppMe; canManage: boolean; onAction: (m: TeamMember, a: Action) => void }) {
  const t = useTranslations("Team");
  const tr = useTranslations("Workspace.roles");
  const f = useFormatter();
  const name = useLocalized();
  const isOwner = me.workspace.role === "owner";
  return useMemo<ColumnDef<TeamMember>[]>(() => {
    const toolName = (key: string) => {
      const tool = me.tools.find((x) => x.key === key);
      return tool ? name(tool.name) : key;
    };
    const cols: ColumnDef<TeamMember>[] = [
      {
        id: "person",
        header: t("colPerson"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const m = row.original;
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={m.name} size="sm" decorative />
              <span className="flex min-w-0 flex-col">
                <bdi dir="auto" className="truncate font-semibold text-fg">
                  {m.name}
                  {m.userKey && m.userKey === me.user.key ? <span className="font-normal text-fg-muted"> ({t("you")})</span> : null}
                </bdi>
                <span dir="ltr" className="truncate text-start text-caption text-fg-muted">
                  {m.email}
                </span>
              </span>
            </span>
          );
        },
      },
      { id: "role", header: t("colRole"), cell: ({ row }) => <span className="whitespace-nowrap text-fg">{tr(row.original.role)}</span> },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) =>
          row.original.status === "invited" ? (
            <Badge tone="warning" emphasis="subtle" icon={<EnvelopeSimple />}>
              {t("invited")}
            </Badge>
          ) : (
            <Badge tone="success" emphasis="subtle" icon={<CheckCircle weight="fill" />}>
              {t("active")}
            </Badge>
          ),
      },
      {
        id: "seat",
        header: t("colSeat"),
        cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{paysSeat(row.original.role) ? t("seatPaid") : t("seatGuest")}</span>,
      },
      {
        id: "tools",
        header: t("colTools"),
        cell: ({ row }) => {
          const tools = row.original.tools;
          if (tools === null) return <span className="whitespace-nowrap text-fg-muted">{t("allTools")}</span>;
          if (!tools.length) return <span className="text-fg-muted">{t("noTools")}</span>;
          return (
            <span className="flex items-center gap-1 whitespace-nowrap">
              {tools.slice(0, MAX_TOOLS).map((k) => (
                <Tag key={k}>{toolName(k)}</Tag>
              ))}
              {tools.length > MAX_TOOLS ? <span className="text-caption text-fg-muted">{t("moreTools", { count: tools.length - MAX_TOOLS })}</span> : null}
            </span>
          );
        },
      },
      {
        id: "joined",
        header: t("colJoined"),
        meta: { numeric: true },
        cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{row.original.joinedAt ? f.date(row.original.joinedAt, { dateStyle: "medium" }) : t("notJoined")}</span>,
      },
    ];
    if (canManage)
      cols.push({
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { width: "1%" },
        cell: ({ row }) => {
          const m = row.original;
          // The owner changes only by a transfer; nobody changes their own role or access here.
          if (m.role === "owner" || (m.userKey && m.userKey === me.user.key)) return null;
          const roles = (["admin", "member", "guest"] as const).filter((r) => r !== m.role && (r !== "admin" || isOwner));
          return (
            <Menu>
              <MenuTrigger render={<IconButton variant="ghost" size="sm" label={t("actionsFor", { name: m.name })} icon={<DotsThreeVertical weight="bold" />} />} />
              <MenuContent align="end">
                {roles.map((r) => (
                  <MenuItem key={r} icon={r === "admin" ? <ShieldCheck /> : r === "guest" ? <UserMinus /> : <User />} onClick={() => onAction(m, { kind: "role", role: r })}>
                    {t(`makeRole.${r}`)}
                  </MenuItem>
                ))}
                <MenuItem icon={<SquaresFour />} onClick={() => onAction(m, { kind: "access" })}>
                  {t("changeAccess")}
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Trash />} onClick={() => onAction(m, { kind: "remove" })}>
                  {m.status === "invited" ? t("withdraw") : t("remove")}
                </MenuItem>
              </MenuContent>
            </Menu>
          );
        },
      });
    return cols;
  }, [t, tr, f, name, me, canManage, isOwner, onAction]);
}

function MemberChange({ team, me, target, onClose, onProblem }: { team: Team; me: AppMe; target: { member: TeamMember; action: Action } | null; onClose: () => void; onProblem: (p: string | null) => void }) {
  const t = useTranslations("Team");
  const tr = useTranslations("Workspace.roles");
  const f = useFormatter();
  const problem = usePlatformProblem();
  const [update] = useUpdateMemberMutation();
  const m = target?.member;
  const action = target?.action;
  const { seats, seatModel, perUserLines } = team.meta;
  const active = m?.status === "active";
  const cost = (role: WorkspaceRole) => {
    const lines = linesFor(perUserLines, seatModel, role, m?.tools ?? null);
    return lines.length ? f.money(sumUnits(lines), lines[0].currency) : null;
  };

  const run = async (body: Parameters<typeof update>[0], done: string) => {
    onProblem(null);
    try {
      await update(body).unwrap();
      toast.success(done);
    } catch (e) {
      // The page says why; the dialog closes.
      onProblem((e as { status?: number }).status === 403 ? t("errors.ownerOnly") : problem(e));
    }
  };

  // What a new role does to seats: paid → guest frees one, guest → paid adds one.
  const roleImpact = (role: Exclude<WorkspaceRole, "owner">) => {
    if (!m) return "";
    const before = paysSeat(m.role);
    const after = paysSeat(role);
    const what = t(`roleWhat.${role}`, { name: m.name });
    if (before === after) return `${what} ${t("impact.seatsSame")}`;
    if (!active) return `${what} ${after ? t("impact.invitedPaid") : t("impact.invitedGuest")}`;
    if (after) {
      const c = cost(role);
      return `${what} ${c ? t("impact.addsSeatCost", { before: seats, after: seats + 1, cost: c }) : t("impact.addsSeat", { before: seats, after: seats + 1 })}`;
    }
    return `${what} ${t("impact.freesSeat", { before: seats, after: seats - 1 })}`;
  };

  return (
    <>
      <ConfirmDialog
        open={action?.kind === "role"}
        onOpenChange={(open) => !open && onClose()}
        title={m && action?.kind === "role" ? t("roleTitle", { name: m.name, role: tr(action.role) }) : ""}
        impact={m && action?.kind === "role" ? roleImpact(action.role) : ""}
        confirmLabel={action?.kind === "role" ? t(`makeRole.${action.role}`) : ""}
        tone="primary"
        onConfirm={() => (m && action?.kind === "role" ? run({ id: m.id, role: action.role }, t("roleChanged", { name: m.name, role: tr(action.role) })) : undefined)}
      />
      <ConfirmDialog
        open={action?.kind === "remove"}
        onOpenChange={(open) => !open && onClose()}
        title={m ? (m.status === "invited" ? t("withdrawTitle", { email: m.email }) : t("removeTitle", { name: m.name })) : ""}
        impact={
          m
            ? m.status === "invited"
              ? t("impact.withdraw", { email: m.email })
              : `${t("impact.remove", { name: m.name, workspace: me.workspace.name })} ${paysSeat(m.role) ? t("impact.freesSeat", { before: seats, after: seats - 1 }) : t("impact.guestNoSeat")}`
            : ""
        }
        confirmLabel={m?.status === "invited" ? t("withdraw") : t("remove")}
        tone="danger"
        onConfirm={() => (m ? run({ id: m.id, status: "removed" }, m.status === "invited" ? t("withdrawn", { email: m.email }) : t("removed", { name: m.name })) : undefined)}
      />
      <AccessDialog
        open={action?.kind === "access"}
        onOpenChange={(open) => !open && onClose()}
        member={m ?? null}
        team={team}
        me={me}
        onSave={(tools) => (m ? run({ id: m.id, tools }, t("accessChanged", { name: m.name })) : Promise.resolve())}
      />
    </>
  );
}
