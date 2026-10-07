import type { ScopeGrant, ToolAccess, ToolKey, WorkspaceContext } from "./types.js";
export declare const TOOL_SCOPES: Record<ToolKey, string>;
export declare function toolAccess(context: WorkspaceContext | null | undefined, key: ToolKey, fallback?: unknown): ToolAccess;
export declare function scopesFromContext(context: WorkspaceContext | null): ScopeGrant[];
//# sourceMappingURL=access.d.ts.map