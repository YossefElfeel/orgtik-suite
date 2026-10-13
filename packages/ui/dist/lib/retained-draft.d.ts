/** Stable across token refresh; separate for each issuer, actor and workspace. No token is stored. */
export declare function retainedDraftKey(name: string): string | null;
export declare function readRetainedDraft(key: string | null): unknown;
export declare function writeRetainedDraft(key: string | null, value: unknown): boolean;
export declare function clearRetainedDraft(key: string | null): void;
//# sourceMappingURL=retained-draft.d.ts.map