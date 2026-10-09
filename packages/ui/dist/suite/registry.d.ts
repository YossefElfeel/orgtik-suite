import type { ToolKey } from "./types.js";
import type { Locale } from "../locale.js";
export declare const SUITE_TOOLS: Record<ToolKey, {
    scope: string;
    app: string;
    labels: Record<Locale, string>;
    adminRoles: string[];
}>;
export declare function toolFromScope(scope: string): ToolKey | undefined;
export declare const CONNECTOR_PAIRS: [ToolKey, ToolKey][];
//# sourceMappingURL=registry.d.ts.map