"use client";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, ConfirmDialog, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useUpdateTeamMutation, useRemoveMembersFromTeamMutation, useDeleteTeamMutation } from "@/redux/features/teams/teamsApi";
import type { ITeamDetails } from "@/types/teams";
import { useRouter } from "@/i18n/routing";
import { useTaskRoles } from "@/lib/permissions";
export default function ManageTeamDialog({ team }: { team: ITeamDetails }) {
  const t = useTranslations("Roadmap"), text = useTranslations("TeamForm"), { isManager } = useTaskRoles();
  const form = useForm<{ name: string; description: string }>({ defaultValues: { name: team.name, description: team.description || "" } });
  const router = useRouter(), [deleteTeam] = useDeleteTeamMutation();
  const [update] = useUpdateTeamMutation(), [remove, removing] = useRemoveMembersFromTeamMutation();
  if (!isManager) return null;
  return <FormDialog title={t("editTeam")} submitLabel={t("save")} cancelLabel={t("cancel")} trigger={<Button variant="secondary" size="sm">{t("editTeam")}</Button>} onSubmit={async () => { let valid = false; await form.handleSubmit(async values => { valid = true; await update({ id: team.id, body: values }).unwrap(); })(); if (!valid) throw Error("invalid"); }}><RHFField control={form.control} name="name" label={t("title")} required rules={{ validate: value => Boolean(value.trim()) || t("saveError"), maxLength: 100 }} render={field => <Input {...field} dir="auto" />} /><RHFField control={form.control} name="description" label={text("description")} optional render={field => <Textarea {...field} dir="auto" />} /><ul className="divide-y divide-line">{team.members.map(member => <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-2"><bdi>{[member.firstName, member.lastName].filter(Boolean).join(" ")}</bdi><ConfirmDialog trigger={<Button size="sm" variant="ghost" loading={removing.isLoading}>{t("removeMember")}</Button>} title={t("removeMember")} impact={team.name} confirmLabel={t("removeMember")} onConfirm={() => remove({ id: team.id, memberIds: [member.id] }).unwrap()} /></li>)}</ul><ConfirmDialog trigger={<Button type="button" variant="danger">{t("deleteTeam")}</Button>} title={t("deleteTeam")} impact={team.name + " · " + t("deleteTeamImpact")} confirmLabel={t("deleteTeam")} onConfirm={async () => { await deleteTeam(team.id).unwrap(); router.replace("/teams"); }} /></FormDialog>;
}
