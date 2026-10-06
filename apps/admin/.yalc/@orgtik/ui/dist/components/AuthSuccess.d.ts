/** Render only after the host has verified and stored the session. */
export declare function AuthSuccess({ onContinue }: {
    onContinue: () => void;
}): import("react").JSX.Element;
/** The host supplies its existing safe destination after authentication succeeds. */
export declare function useAuthSuccess(): {
    confirm: (onContinue: () => void) => void;
    success: import("react").JSX.Element | null;
};
//# sourceMappingURL=AuthSuccess.d.ts.map