"use client";
import { createContext, useContext, useMemo } from "react";
import { useClientSession } from "../auth/session.js";
import { CONNECTOR_PAIRS, SUITE_TOOLS } from "./registry.js";
import type { ConnectionState, SuiteOptions, SuiteProviderProps, SuiteSnapshot, ToolKey } from "./types.js";

const Context = createContext<SuiteOptions>({});
export function SuiteProvider({ children, ...options }: SuiteProviderProps) { return <Context.Provider value={options}>{children}</Context.Provider>; }
const canRead = (access?: string) => Boolean(access && !["no_access", "not_subscribed"].includes(access));
export function connectionState(snapshot: SuiteSnapshot | null, source: ToolKey | undefined, target: ToolKey, write = true, targetWrite = false): ConnectionState {
  if (snapshot?.actor.readOnly || snapshot?.workspace.state === "suspended" || source && snapshot?.tools[source]?.access === "read_only") return "read_only";
  if (source) {
    const origin = snapshot?.tools[source];
    if (!origin || origin.access === "not_subscribed") return "not_subscribed";
    if (origin.access === "no_access") return origin.reason === "unsupported_tool_role" ? "role_denied" : "no_access";
  }
  const tool = snapshot?.tools[target];
  if (!tool || tool.access === "not_subscribed") return "not_subscribed";
  if (tool.access === "no_access") return tool.reason === "unsupported_tool_role" ? "role_denied" : "no_access";
  if (tool.access === "read_only") return "read_only";
  if (write && source && !snapshot?.tools[source]?.canWrite) return "role_denied";
  if (targetWrite && !tool.canWrite) return "role_denied";
  if (source && source !== target) {
    if (!CONNECTOR_PAIRS.some(([a,b]) => a === source && b === target || a === target && b === source)) return "disabled";
    if (snapshot?.connectors?.some(connector => (connector.source === source && connector.target === target || connector.source === target && connector.target === source) && !connector.enabled)) return "disabled";
  }
  return "available";
}
export function useSuite() {
  const options = useContext(Context), session = useClientSession();
  const snapshot = options.snapshot === undefined ? session?.workspaceContext as SuiteSnapshot | null ?? null : options.snapshot;
  return useMemo(() => {
    const toolState = (tool: ToolKey) => snapshot?.tools[tool];
    const hasTool = (tool: ToolKey) => Boolean(toolState(tool) && toolState(tool)?.access !== "not_subscribed");
    const accessibleTools = (Object.keys(SUITE_TOOLS) as ToolKey[]).filter(tool => canRead(toolState(tool)?.access));
    const isOwner = snapshot?.member.role === "owner" && !snapshot.actor.readOnly;
    const canAdmin = (tool: ToolKey) => canRead(toolState(tool)?.access) && Boolean(toolState(tool)?.canWrite) && Boolean(["owner", "admin"].includes(snapshot?.member.role || "") || toolState(tool)?.roles.some(role => SUITE_TOOLS[tool].adminRoles.includes(role)));
    return { ...options, snapshot, session, toolState, hasTool, accessibleTools, isOwner, canAdmin, loading: options.loading ?? (!snapshot && !session), seat: (tool: ToolKey) => toolState(tool)?.seats, connectionState: (target: ToolKey, source = options.currentTool, write = true, targetWrite = false) => connectionState(snapshot ?? null, source, target, write, targetWrite), canConnect: (source: ToolKey, target: ToolKey) => connectionState(snapshot ?? null, source, target, false) === "available" };
  }, [options, snapshot, session]);
}
