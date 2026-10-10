"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../theme/theme.js";
import { useOrgtik } from "../provider/OrgtikProvider.js";
import { readClientSession } from "../auth/session.js";
import { useSuite } from "./useSuite.js";
import { suiteRequest } from "./api.js";
import { suiteText } from "./strings.js";
/** Personal appearance follows handoffs. Unset preferences leave the host's existing choice intact. */
export function PreferenceSync() {
    const suite = useSuite(), { locale } = useOrgtik(), [, setTheme] = useTheme(), applying = useRef(false), applied = useRef(undefined), latest = useRef({}), [failed, setFailed] = useState(false);
    const apiUrl = suite.apiUrl, prefs = suite.snapshot?.preferences, userId = suite.snapshot?.actor.effectiveUserId, workspaceId = suite.snapshot?.workspace.id, token = suite.session?.tokens.accessToken;
    const key = `${apiUrl}:${workspaceId}:${userId}`;
    useEffect(() => {
        if (!apiUrl || !prefs || !token || applied.current === key)
            return;
        latest.current = prefs;
        applying.current = true;
        if (prefs.theme)
            setTheme(prefs.theme);
        applying.current = false;
        applied.current = key;
    }, [apiUrl, prefs, token, key, setTheme]);
    useEffect(() => {
        if (!apiUrl || !prefs || !token || suite.snapshot?.actor.readOnly)
            return;
        const current = () => readClientSession()?.tokens.accessToken === token && readClientSession()?.workspaceContext?.workspace.id === workspaceId;
        const save = (patch) => {
            if (applying.current || !current() || Object.entries(patch).every(([name, value]) => latest.current[name] === value))
                return;
            void suiteRequest(apiUrl, "/preferences", { method: "PATCH", body: patch, keepalive: true }).then(value => { if (current()) {
                latest.current = value;
                setFailed(false);
            } }, () => { if (current())
                setFailed(true); });
        };
        const theme = () => save({ theme: document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light" });
        const language = (event) => { const value = event.detail; if (["en", "ar", "de", "fr", "it"].includes(value))
            save({ language: value }); };
        window.addEventListener("orgtik:theme", theme);
        window.addEventListener("orgtik:locale", language);
        return () => { window.removeEventListener("orgtik:theme", theme); window.removeEventListener("orgtik:locale", language); };
    }, [apiUrl, prefs, token, workspaceId, suite.snapshot?.actor.readOnly]);
    return failed ? _jsx("p", { role: "alert", className: "px-4 py-2 text-body-sm text-danger", children: suiteText(locale, "preferencesFailed") }) : null;
}
//# sourceMappingURL=PreferenceSync.js.map