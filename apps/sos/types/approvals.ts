import type { ToolKey } from "@orgtik/ui";
export type ApprovalItem = { id: string; tool: ToolKey | "account"; sourceTool?: ToolKey; kind: string; title: string; path: string; at?: string };
