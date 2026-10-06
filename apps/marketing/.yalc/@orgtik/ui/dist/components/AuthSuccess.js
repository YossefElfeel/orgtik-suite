"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SealCheck, ShieldCheck } from "@phosphor-icons/react";
import { useOrgtik, useStrings } from "../provider/OrgtikProvider.js";
import { Badge } from "./Badge.js";
import { Progress } from "./Meters.js";
/** Render only after the host has verified and stored the session. */
export function AuthSuccess({ onContinue }) {
    const t = useStrings();
    const { dir } = useOrgtik();
    const content = useRef(null);
    const seal = useRef(null);
    const headline = useRef(null);
    const card = useRef(null);
    const badge = useRef(null);
    const heading = useRef(null);
    const next = useRef(onContinue);
    useLayoutEffect(() => {
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        const animations = [];
        const enter = (element, frames, duration, delay = 0, easing = "cubic-bezier(0.16, 1, 0.3, 1)") => {
            if (element?.animate)
                animations.push(element.animate(frames, { duration, delay, easing, fill: "backwards" }));
        };
        if (preference.matches) {
            enter(content.current, [{ opacity: 0.8 }, { opacity: 1 }], 120);
        }
        else {
            enter(content.current, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }], 300);
            // Reproduce the original seal's spring (stiffness 200, damping 12) without
            // a motion dependency. Animate its wrapper rather than the SVG.
            const spring = Array.from({ length: 49 }, (_, index) => {
                const time = (index / 48) * 0.8;
                const frequency = Math.sqrt(200 - 6 * 6);
                const value = index === 48 ? 1 : 1 - Math.exp(-6 * time) * (Math.cos(frequency * time) + (6 / frequency) * Math.sin(frequency * time));
                return { offset: index / 48, transform: `scale(${value}) rotate(${-90 * (1 - value)}deg)` };
            });
            enter(seal.current, spring, 800, 200, "linear");
            enter(headline.current, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], 300, 100);
            enter(card.current, [{ opacity: 0, transform: "scale(0.95)" }, { opacity: 1, transform: "scale(1)" }], 300, 200);
            // The value is already verified (100%); the fill is its visual confirmation.
            const fill = card.current?.querySelector(".bg-action-primary") ?? null;
            const transformOrigin = dir === "rtl" ? "right" : "left";
            enter(fill, [{ transform: "scaleX(0)", transformOrigin }, { transform: "scaleX(1)", transformOrigin }], 800, 300, "ease-out");
            enter(badge.current, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], 300, 400);
        }
        const cancel = () => animations.forEach((animation) => animation.cancel());
        const onPreferenceChange = (event) => {
            if (event.matches)
                cancel();
        };
        preference.addEventListener("change", onPreferenceChange);
        return () => {
            cancel();
            preference.removeEventListener("change", onPreferenceChange);
        };
    }, [dir]);
    useEffect(() => {
        next.current = onContinue;
    }, [onContinue]);
    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        const timer = window.setTimeout(() => next.current(), 1800);
        return () => window.clearTimeout(timer);
    }, []);
    return (_jsx("section", { "data-auth-success": "true", role: "status", "aria-live": "polite", "aria-atomic": "true", className: "fixed inset-0 z-50 grid overflow-y-auto bg-canvas px-5 py-10 font-body text-fg", children: _jsxs("div", { ref: content, className: "m-auto flex w-full max-w-xl flex-col items-center text-center", children: [_jsx("div", { ref: seal, "aria-hidden": "true", className: "shrink-0", children: _jsx(SealCheck, { weight: "fill", className: "size-24 text-success-solid" }) }), _jsxs("div", { ref: headline, className: "mt-6 flex w-full flex-col items-center", children: [_jsx("h1", { ref: heading, tabIndex: -1, className: "font-display text-title outline-none", children: t("authSuccessTitle") }), _jsx("p", { className: "mt-3 max-w-lg text-body-lg text-fg-muted", children: t("authSuccessBody") })] }), _jsxs("div", { ref: card, className: "mt-10 w-full rounded-card border border-success-solid/25 bg-raised p-5 text-start", children: [_jsx(Progress, { value: 100, label: _jsx("span", { className: "text-success", children: t("authVerified") }), className: "[&_.bg-action-primary]:bg-success-solid" }), _jsx("p", { className: "mt-3 text-caption font-medium uppercase text-success", children: t("authAccessGranted") })] }), _jsx("div", { ref: badge, className: "mt-12 max-w-full", children: _jsx(Badge, { tone: "success", icon: _jsx(ShieldCheck, {}), className: "h-10 gap-2 px-5 uppercase", children: t("authSecureAccess") }) })] }) }));
}
/** The host supplies its existing safe destination after authentication succeeds. */
export function useAuthSuccess() {
    const [next, setNext] = useState(null);
    const confirm = useCallback((onContinue) => setNext(() => onContinue), []);
    return { confirm, success: next ? _jsx(AuthSuccess, { onContinue: next }) : null };
}
//# sourceMappingURL=AuthSuccess.js.map