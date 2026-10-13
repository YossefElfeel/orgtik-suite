"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSuite } from "@orgtik/ui";
import { switchWorkspace, type AuthEnvelope } from "@orgtik/ui/auth";
import { useAppDispatch } from "@/redux/app/hooks";
import { performLogout, switchSession } from "@/redux/features/auth/authThunks";
import { API_URL } from "@/constants/env";
import type { IUser, IScopeItem } from "@/types/user";
export type AccountBootstrap = { workspace: { id: string; name: string; state: string; role: string; country: string; currency: string; timeZone: string; logo?: import("@/types/file-references").AccountFileReference | null }; countries: string[]; person: { id: number; name: string; email: string }; permissions: { owner: boolean; admin: boolean; readOnly: boolean }; security: Security; sso: Sso; roles: CustomRole[]; billingContacts: BillingContact[]; onboarding: Onboarding; preferences: { theme?: "light" | "dark"; density?: "comfortable" | "compact"; language?: string; notificationPreferences?: Record<string, boolean> }; product: Product };
export type Security = { person: AccountBootstrap["person"]; actualEmailVerified: boolean; emailPreview: { state: string; at?: string }; twoFactor: { enabled: boolean; generation: number; recoverySamples?: string[]; at?: string }; policy: { requireTwoFactor: boolean }; setupCode: string; simulated: true };
export type Sso = { enabled: boolean; provider: string; domain: string; simulated?: true };
export type CustomRole = { id: string; name: string; baseRole: "admin" | "member" | "guest" };
export type BillingContact = { id: string; name: string; email: string };
export type Onboarding = { steps: { id: string; complete: boolean }[]; dismissed: boolean; tools: string[] };
export type Product = { sampledAt: string; simulated: true; tools: { key: string; access: string; canWrite: boolean; catalogState: string }[]; announcements: Record<string, unknown>[]; changelog: Record<string, unknown>[]; feedback: { id: string; kind: string; text: string; state: string; at: string }[]; helpTopics: string[] };
export type ActionResult = { sessionAction?: "signed_out" | "session_changed" | "choose_workspace"; session?: AuthEnvelope<IUser>; workspaceId?: string | null };
export function useAccountResource<T>(path: string, skip = false) {
  const suite = useSuite(), key = `${suite.session?.tokens.accessToken || ""}:${suite.snapshot?.workspace.id || ""}:${path}`, keyRef = useRef(key);
  keyRef.current = key;
  const [record, setRecord] = useState<{ key: string; data?: T; error?: unknown; loading: boolean }>({ key: "", loading: true });
  const load = useCallback(async () => { if (skip || !suite.session?.tokens.accessToken || !suite.snapshot?.workspace.id) return; setRecord(before => ({ key, data: before.key === key ? before.data : undefined, loading: true })); try { const data = await suite.request<T>(path.startsWith("suite:") ? path.slice(6) : "/account" + path); if (keyRef.current === key) setRecord({ key, data, loading: false }); } catch (error) { if (keyRef.current === key) setRecord(before => ({ key, data: before.key === key ? before.data : undefined, error, loading: false })); } }, [key, path, skip, suite.apiUrl]);
  useEffect(() => { void load(); }, [load]);
  return { data: record.key === key ? record.data : undefined, error: record.key === key ? record.error : undefined, loading: !skip && (record.key !== key || record.loading && record.data === undefined), refetch: load };
}
export function useAccountAction() {
  const suite = useSuite(), dispatch = useAppDispatch(), router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState<unknown>();
  const act = async <T,>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> => { setBusy(true); setError(undefined); try { const result = await suite.request<T>("/account" + path, method, body), action = result as ActionResult; if (action.sessionAction === "signed_out") { dispatch(performLogout()); router.replace("/auth/login"); } else if (action.sessionAction === "session_changed" && action.session) { dispatch(switchSession({ ...action.session, scopes: action.session.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) as IScopeItem[] })); router.replace(action.workspaceId ? "/" : "/account/identity"); } else if (action.sessionAction === "choose_workspace" && action.workspaceId && suite.session) { const session = await switchWorkspace<IUser>(API_URL, suite.session.tokens.accessToken, action.workspaceId); dispatch(switchSession({ ...session, scopes: session.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) as IScopeItem[] })); router.replace("/"); } else await suite.refresh?.(); return result; } catch (failure) { setError(failure); throw failure; } finally { setBusy(false); } };
  return { act, busy, error, clearError: () => setError(undefined) };
}
