"use client";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, demoRequest, Field, Select, SimulatedTag, useDemoScene } from "@orgtik/ui";
import InnerHeader from "@/components/layout/InnerHeader";
import { PolicyBalance } from "@/components/presentation/PolicyBalance";
import { ProfileRequest } from "@/components/presentation/ProfileRequest";
import CsvImport from "@/components/presentation/CsvImport";
import BankPreview from "@/components/presentation/BankPreview";
import OnboardingChecklist from "@/components/presentation/OnboardingChecklist";
import ExpiryMailbox from "@/components/presentation/ExpiryMailbox";
import { HR_DEMO_PERSONAS, HR_DEMO_POLICY, onboardingTasks, seedHrEmployees } from "@/mock/presentation";
import type { DemoEmployee, DemoMail, DemoOnboardingTask, DemoPolicy, ProfileChange, ProfileFormValues } from "@/types/presentation";

export default function PresentationPage() {
  const t = useTranslations("HrPresentation"), demo = useDemoScene(), workspace = demo.scene.workspace === "current" ? "nile" : demo.scene.workspace;
  const [employees, setEmployees] = useState<DemoEmployee[]>(() => seedHrEmployees(workspace)), [policy, setPolicy] = useState<DemoPolicy>(HR_DEMO_POLICY), [requests, setRequests] = useState<ProfileChange[]>([]), [tasks, setTasks] = useState<DemoOnboardingTask[]>([]), [messages, setMessages] = useState<DemoMail[]>([]), [employeeId, setEmployeeId] = useState("person-0"), [view, setView] = useState("balances"), [notice, setNotice] = useState("");
  const persona = HR_DEMO_PERSONAS[demo.scene.persona], canManage = ["current", "mona", "nour", "rana"].includes(demo.scene.persona);
  const [revision, setRevision] = useState(0), [pendingEmployee, setPendingEmployee] = useState<string>();
  const createOnboarding = async (id: string) => {
    if (!canManage || pendingEmployee || tasks.some(task => task.employeeId === id)) return;
    const person = employees.find(person => person.id === id); if (!person) return;
    setPendingEmployee(id); const checklist = onboardingTasks(id);
    try {
      if (demo.runtime) await demoRequest(demo.runtime, demo.scene, "/tasks/batch", { tasks: checklist.map(task => ({ title: `${person.name}: ${t(task.titleKey)}`, owner: task.owner, sourceApp: "hr", sourceId: task.id })) });
      setTasks(before => [...before, ...checklist]); mail(id, "onboardingSubject"); setNotice(t(demo.runtime ? "onboardingConnected" : "onboardingCreated"));
    } catch { setNotice(t("connectionError")); } finally { setPendingEmployee(undefined); }
  };
  const canRequest = canManage || employees.some(person => person.id === employeeId && person.name === persona);
  const reset = () => { const people = seedHrEmployees(workspace); setEmployees(people); setPolicy(HR_DEMO_POLICY); setRequests([]); setTasks([]); setMessages([]); setNotice(""); setEmployeeId(people.find(person => person.name === persona)?.id ?? (canManage ? people[0]?.id ?? "" : "")); setRevision(before => before + 1); };
  useEffect(() => { reset(); }, [workspace]);
  useEffect(() => { const self = employees.find(person => person.name === persona); setEmployeeId(self?.id ?? (canManage ? employees[0]?.id ?? "" : "")); }, [demo.scene.persona]);
  const mail = (employeeId: string, subjectKey: DemoMail["subjectKey"]) => setMessages(before => [{ id: crypto.randomUUID(), employeeId, subjectKey }, ...before]);
  const requestChange = (values: ProfileFormValues) => { if (!canRequest || !employeeId || requests.some(request => request.employeeId === employeeId && request.status === "pending")) return; setRequests(before => [...before, { id: crypto.randomUUID(), employeeId, ...values, status: "pending" }]); setNotice(t("requestSaved")); };
  const decide = (id: string, status: "approved" | "rejected") => { const request = requests.find(item => item.id === id); if (!canManage || !request || request.status !== "pending") return; setRequests(before => before.map(item => item.id === id ? { ...item, status } : item)); if (status === "approved") setEmployees(before => before.map(person => person.id === request.employeeId ? { ...person, email: request.email, phone: request.phone } : person)); mail(request.employeeId, status === "approved" ? "profileApproved" : "profileRejected"); setNotice(t("decisionSaved")); };
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_DEMO_PANEL !== "1") notFound();
  return <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6"><InnerHeader title={t("heading")} description={t("intro")} actions={<Button variant="secondary" startIcon={<ArrowCounterClockwise />} onClick={reset}>{t("reset")}</Button>} /><div className="flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-body-sm text-fg-muted"><SimulatedTag />{t("localOnly")}</p><Field label={t("show")}><Select value={view} onValueChange={value => value && setView(value)} options={["balances", "profile", "import", "bank", "onboarding", "mailbox"].map(value => ({ value, label: t(value) }))} /></Field></div>{notice ? <p role="status" className="text-body text-fg-brand">{notice}</p> : null}
    {view === "balances" ? <PolicyBalance key={revision} employees={employees} employeeId={employeeId} policy={policy} canManage={canManage} onSave={value => { setPolicy(value); setNotice(t("policySaved")); }} /> : null}
    {view === "profile" ? <ProfileRequest key={revision} employees={employees} requests={requests} employeeId={employeeId} canApprove={canManage} canRequest={canRequest} onEmployee={setEmployeeId} onRequest={requestChange} onDecision={decide} /> : null}
    {view === "import" ? <CsvImport key={revision} employees={employees} canManage={canManage} onImport={people => { setEmployees(before => [...before, ...people]); if (!employees.some(person => person.id === employeeId)) setEmployeeId(people[0]?.id ?? ""); setNotice(t("imported")); }} /> : null}
    {view === "bank" ? <BankPreview key={revision} employees={employees} canManage={canManage} onDownload={() => setNotice(t("bankDownloaded"))} /> : null}
    {view === "onboarding" ? <OnboardingChecklist employees={canManage ? employees : employees.filter(person => person.id === employeeId)} tasks={tasks} canManage={canManage} pendingEmployee={pendingEmployee} onToggle={id => setTasks(before => before.map(task => task.id === id ? { ...task, done: !task.done } : task))} onCreate={createOnboarding} /> : null}
    {view === "mailbox" ? <ExpiryMailbox employees={canManage ? employees : employees.filter(person => person.id === employeeId)} messages={canManage ? messages : messages.filter(message => message.employeeId === employeeId)} canManage={canManage} onRemind={id => { mail(id, "expirySubject"); setNotice(t("reminderCreated")); }} /> : null}
    <p className="max-w-prose text-caption text-fg-muted">{t("reuseNote")}</p>
  </div>;
}
