"use client";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_COOKIE } from "./theme-script.js";
function readTheme() {
    if (typeof document === "undefined")
        return DEFAULT_THEME;
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
/** The current theme and a setter that applies it now and remembers it for a year. */
export function useTheme() {
    const [theme, setState] = useState(DEFAULT_THEME);
    useEffect(() => setState(readTheme()), []);
    const setTheme = useCallback((next) => {
        document.documentElement.setAttribute("data-theme", next);
        document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        setState(next);
    }, []);
    return [theme, setTheme];
}
//# sourceMappingURL=theme.js.map