"use client";
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, DotsThreeVertical, EnvelopeSimple, Plus, ShieldCheck, SquaresFour, Trash, User, UserMinus } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, ConfirmDialog, ErrorState, IconButton, LoadingState, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, NoPermissionState, PageHeader, Tag, Toolbar, toast, useFormatter } from '@orgtik/ui';
import { DataTable, type ColumnDef } from '@orgtik/ui/table';
import useWorkspace from '@/hooks/use-workspace';
import type { AppMe, WorkspaceRole } from '@/redux/features/platform/platformApi';
import { useGetTeamQuery, useUpdateMemberMutation, useGetInvitationsQuery, useInvitationActionMutation, type Team, type TeamMember } from '@/redux/features/platform/team';
import { useLocalized, usePlatformProblem } from '@/components/workspace/account/problems';
import { Notice } from '@/components/workspace/account/Notice';
import { InviteDialog } from './InviteDialog';
import { AccessDialog } from './AccessDialog';
import { InvitationDeliveryButton } from '@/components/workspace/mailbox/InvitationDeliveryButton';
import { OwnershipTransferDialog } from '@/components/workspace/team/OwnershipTransferDialog';
import { selection, supportedTools, membershipSeatState } from './seats';
import { attemptNamespace, readActionAttempt, saveActionAttempt, uncertainResult, type InvitationActionAttempt } from './attempts';
import { PaginatedTable } from "@orgtik/ui/table";
type Action = { kind: 'role'; role: Exclude<WorkspaceRole, 'owner'> } | { kind: 'access' } | { kind: 'remove' };
const MAX_TOOLS = 2;
function TeamContent() {
  const t = useTranslations('Team'), ws = useWorkspace(), me = ws.me as AppMe;
  const { data: team, isLoading, isError, refetch } = useGetTeamQuery();
  const canManage = ws.isAdmin && me.can.team && !me.workspaceContext?.actor.readOnly && me.workspace.state !== 'suspended';
  const [inviting, setInviting] = useState(false), [target, setTarget] = useState<{ member: TeamMember; action: Action } | null>(null), [problem, setProblem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const columns = useColumns({ me, canManage, onAction: (member, action) => setTarget({ member, action }) });
  return <div className="flex flex-col gap-6">
    <PageHeader title={t('title')} description={t(canManage ? 'description' : 'readOnly', { name: me.workspace.name })} actions={canManage && team ? <div className="flex flex-wrap gap-2"><OwnershipTransferDialog me={me} team={team} /><Button variant="primary" startIcon={<Plus />} onClick={() => setInviting(true)}>{t('invite.open')}</Button></div> : undefined} />
    {problem && <Notice tone="danger">{problem}</Notice>}
    {isLoading ? <LoadingState rows={6} /> : isError || !team?.meta.perTool ? <ErrorState title={t('failedTitle')} description={t('failedBody')} onRetry={refetch} /> : <>
      <SeatsSummary team={team} me={me} /><Toolbar label={t("title")} search={{ value: search, onChange: setSearch, label: t("title") }} />
      <DataTable label={t('tableLabel', { name: me.workspace.name })} columns={columns} data={team.items.filter(member => `${member.name} ${member.email}`.toLowerCase().includes(search.toLowerCase()))} getRowId={member => member.id} paginate empty={{ title: t('emptyTitle'), description: t('emptyBody') }} />
      {canManage && <><Invitations me={me} /><InviteDialog open={inviting} onOpenChange={setInviting} me={me} team={team} /></>}
      {canManage && <MemberChange team={team} me={me} target={target} onClose={() => setTarget(null)} onProblem={setProblem} />}
    </>}
  </div>;
}
function SeatsSummary({ team, me }: { team: Team; me: AppMe }) {
  const t = useTranslations('Team.seats'), f = useFormatter(), name = useLocalized();
  const tools = supportedTools(me.tools, team.meta.perTool, 'owner');
  return <Card className="flex flex-col gap-5">
    <div className="flex flex-col gap-1"><h2 className="font-display text-title-sm text-fg">{t('title')}</h2><p className="max-w-prose text-body-sm text-fg-muted">{t('modelB')}</p></div>
    <div className="overflow-x-auto"><PaginatedTable><table className="w-full text-start text-body-sm"><caption className="sr-only">{t('title')}</caption><thead><tr className="text-fg-muted">{['tool', 'purchased', 'assigned', 'reserved', 'available'].map(key => <th key={key} scope="col" className="px-3 py-2 text-start font-medium">{t(key)}</th>)}</tr></thead>
      <tbody>{tools.map(tool => { const count = team.meta.perTool[tool.key]; return <tr key={tool.key} className="border-t border-line"><th scope="row" className="px-3 py-3 text-start font-semibold"><bdi>{name(tool.name)}</bdi></th>{[count.capacity, count.assigned, count.reserved, count.available].map((value, index) => <td key={index} className="px-3 py-3 tabular-nums text-fg-muted">{value === null ? t('licence') : f.number(value)}</td>)}</tr>; })}</tbody></table></PaginatedTable></div>
    {!tools.length && <p className="text-body-sm text-fg-muted">{t('noLines')}</p>}
    <p className="text-caption text-fg-muted">{t('linesNote')}</p>
  </Card>;
}
function useColumns({ me, canManage, onAction }: { me: AppMe; canManage: boolean; onAction: (member: TeamMember, action: Action) => void }) {
  const tv = useTranslations('AccountV3');
  const t = useTranslations('Team'), tr = useTranslations('Workspace.roles'), f = useFormatter(), name = useLocalized();
  const owner = me.workspace.role === 'owner';
  return useMemo<ColumnDef<TeamMember>[]>(() => {
    const toolName = (key: string) => { const tool = me.tools.find(item => item.key === key); return tool ? name(tool.name) : key; };
    const columns: ColumnDef<TeamMember>[] = [
      { id: 'person', header: t('colPerson'), meta: { truncate: true }, cell: ({ row }) => <span className="flex min-w-0 items-center gap-3"><Avatar name={row.original.name} size="sm" decorative /><span className="flex min-w-0 flex-col"><bdi className="truncate font-semibold text-fg">{row.original.name}{row.original.userKey === me.user.key && <span className="font-normal text-fg-muted"> ({t('you')})</span>}</bdi><span dir="ltr" className="truncate text-start text-caption text-fg-muted">{row.original.email}</span></span></span> },
      { id: 'role', header: t('colRole'), cell: ({ row }) => <span className="whitespace-nowrap">{tr(row.original.role)}</span> },
      { id: 'status', header: t('colStatus'), cell: ({ row }) => <Badge tone={row.original.status === 'active' ? 'success' : 'warning'} emphasis="subtle" icon={row.original.status === 'active' ? <CheckCircle weight="fill" /> : <EnvelopeSimple />}>{row.original.status === 'suspended' ? tv('suspended') : row.original.status === 'removed' ? tv('removed') : t(row.original.status === 'active' ? 'active' : 'invited')}</Badge> },
      { id: 'seat', header: t('colSeat'), cell: ({ row }) => <span className="text-fg-muted">{['suspended', 'removed'].includes(row.original.status) ? tv('accessSuspended') : t(membershipSeatState(row.original.status) === 'assigned' ? 'seatPaid' : 'seatReserved')}</span> },
      { id: 'tools', header: t('colTools'), cell: ({ row }) => { const tools = row.original.tools; if (tools === null) return <span className="text-fg-muted">{t('allTools')}</span>; if (!tools.length) return <span className="text-fg-muted">{t(row.original.status === 'active' ? 'noTools' : 'pendingTools')}</span>; return <span className="flex flex-wrap gap-1">{tools.slice(0, MAX_TOOLS).map(key => <Tag key={key}>{toolName(key)}</Tag>)}{tools.length > MAX_TOOLS && <span className="text-caption text-fg-muted">{t('moreTools', { count: tools.length - MAX_TOOLS })}</span>}</span>; } },
      { id: 'joined', header: t('colJoined'), cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{row.original.joinedAt ? f.date(row.original.joinedAt, { dateStyle: 'medium' }) : t('notJoined')}</span> },
    ];
    if (canManage) columns.push({ id: 'actions', header: () => <span className="sr-only">{t('colActions')}</span>, cell: ({ row }) => {
      const member = row.original;
      if (member.status !== 'active' || member.role === 'owner' || member.userKey === me.user.key) return null;
      const roles = (['admin', 'member', 'guest'] as const).filter(role => role !== member.role && (role !== 'admin' || owner));
      return <Menu><MenuTrigger render={<IconButton variant="ghost" size="sm" label={t('actionsFor', { name: member.name })} icon={<DotsThreeVertical weight="bold" />} />} /><MenuContent align="end">{roles.map(role => <MenuItem key={role} icon={role === 'admin' ? <ShieldCheck /> : role === 'guest' ? <UserMinus /> : <User />} onClick={() => onAction(member, { kind: 'role', role })}>{t(`makeRole.${role}`)}</MenuItem>)}<MenuItem icon={<SquaresFour />} onClick={() => onAction(member, { kind: 'access' })}>{t('changeAccess')}</MenuItem><MenuSeparator /><MenuItem icon={<Trash />} onClick={() => onAction(member, { kind: 'remove' })}>{t('remove')}</MenuItem></MenuContent></Menu>;
    } });
    return columns;
  }, [t, tr, f, name, me, canManage, owner, onAction]);
}
function Invitations({ me }: { me: AppMe }) {
  const t = useTranslations('Team.invitationList'), f = useFormatter(), problem = usePlatformProblem();
  const { data, isLoading, isError, refetch } = useGetInvitationsQuery();
  const [act, { isLoading: busy }] = useInvitationActionMutation();
  const namespace = attemptNamespace(me.workspaceContext?.realm || 'demo', me.workspace.id, me.user.id);
  const [pending, setPending] = useState<InvitationActionAttempt | null>(null), [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { const stored = readActionAttempt(namespace); setPending(stored); setFailure(stored?.uncertain ? t('uncertain') : null); }, [namespace, t]);
  const run = async (id: string, action: 'resend' | 'cancel') => {
    const attempt = pending || { id, action, operationId: crypto.randomUUID(), uncertain: false };
    setPending(attempt); saveActionAttempt(namespace, attempt); setFailure(null);
    try { const result = await act(attempt).unwrap(); setPending(null); saveActionAttempt(namespace, null); toast.success(t(result.status === 'cancelled' ? 'cancelled' : result.status === 'pending' ? 'resent' : 'confirmed')); }
    catch (error) { if (attempt.uncertain || uncertainResult(error)) { const retained = { ...attempt, uncertain: true }; setPending(retained); saveActionAttempt(namespace, retained); setFailure(t('uncertain')); } else { setPending(null); saveActionAttempt(namespace, null); setFailure(problem(error)); } }
  };
  const rows = (data || []).filter(invitation => ['pending', 'expired'].includes(invitation.status));
  return <Card className="flex flex-col gap-4"><h2 className="font-display text-title-sm">{t('title')}</h2>
    {isLoading ? <LoadingState rows={2} /> : isError ? <ErrorState title={t('failed')} onRetry={refetch} /> : !rows.length ? <p className="text-body-sm text-fg-muted">{t('empty')}</p> : <ul className="divide-y divide-line">{rows.map(invitation => <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p dir="ltr" className="break-all text-start font-medium">{invitation.email}</p><p className="text-caption text-fg-muted">{t(invitation.status === 'expired' ? 'expired' : 'expires', { date: f.date(invitation.expiresAt, { dateStyle: 'medium' }) })}</p></div><div className="flex flex-wrap items-start gap-2">{invitation.status === 'pending' && <InvitationDeliveryButton invitationId={invitation.id} disabled={busy || Boolean(pending)} />}<Button size="sm" disabled={busy || Boolean(pending) || invitation.role === 'admin' && me.workspace.role !== 'owner'} onClick={() => run(invitation.id, 'resend')}>{t('resend')}</Button><Button size="sm" variant="secondary" disabled={busy || Boolean(pending)} onClick={() => run(invitation.id, 'cancel')}>{t('cancel')}</Button></div></li>)}</ul>}
    {failure && <Notice tone="warning">{failure}</Notice>}
    {pending && <Button variant="secondary" loading={busy} onClick={() => run(pending.id, pending.action)}>{t('recover')}</Button>}
  </Card>;
}
function MemberChange({ team, me, target, onClose, onProblem }: { team: Team; me: AppMe; target: { member: TeamMember; action: Action } | null; onClose: () => void; onProblem: (value: string | null) => void }) {
  const t = useTranslations('Team'), tr = useTranslations('Workspace.roles'), problem = usePlatformProblem();
  const [update] = useUpdateMemberMutation(), member = target?.member, action = target?.action;
  const run = async (body: Parameters<typeof update>[0], done: string) => { onProblem(null); try { await update(body).unwrap(); toast.success(done); } catch (error) { onProblem(problem(error)); throw error; } };
  return <>
    <ConfirmDialog open={action?.kind === 'role'} onOpenChange={open => !open && onClose()} title={member && action?.kind === 'role' ? t('roleTitle', { name: member.name, role: tr(action.role) }) : ''} impact={member && action?.kind === 'role' ? `${t(`roleWhat.${action.role}`, { name: member.name })} ${t('impact.seatsSame')}` : ''} confirmLabel={action?.kind === 'role' ? t(`makeRole.${action.role}`) : ''} tone="primary" onConfirm={() => member && action?.kind === 'role' ? run({ id: member.id, role: action.role, tools: selection(me.tools, team.meta.perTool, action.role, member.tools) }, t('roleChanged', { name: member.name, role: tr(action.role) })) : undefined} />
    <ConfirmDialog open={action?.kind === 'remove'} onOpenChange={open => !open && onClose()} title={member ? t('removeTitle', { name: member.name }) : ''} impact={member ? `${t('impact.remove', { name: member.name, workspace: me.workspace.name })} ${t('impact.releases')}` : ''} confirmLabel={t('remove')} tone="danger" onConfirm={() => member ? run({ id: member.id, status: 'removed' }, t('removed', { name: member.name })) : undefined} />
    <AccessDialog open={action?.kind === 'access'} onOpenChange={open => !open && onClose()} member={member || null} team={team} me={me} onSave={tools => member ? run({ id: member.id, tools }, t('accessChanged', { name: member.name })) : Promise.resolve()} />
  </>;
}

export function TeamView() {
  const ws = useWorkspace(), t = useTranslations("AccountV3");
  if (ws.error) return [401, 403].includes((ws.error as { status?: number }).status || 0) ? <NoPermissionState title={t("forbidden")} description={t("askOwner")} /> : <ErrorState title={t("loadFailed")} onRetry={ws.refetch} />;
  if (ws.isLoading || !ws.me) return <LoadingState rows={6} />;
  return <TeamContent />;
}
