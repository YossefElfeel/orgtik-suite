import { useEffect, type ReactNode } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import { OrgtikProvider, TooltipProvider, directionOf, type Locale } from "@orgtik/ui";
import "../src/storybook.css";

// One frame: its own theme, language and direction. data-theme and lang work on any element,
// so four frames can sit side by side (the matrix mode).
function Frame({ theme, locale, children, label }: { theme: string; locale: Locale; children: ReactNode; label?: string }) {
  return (
    <div data-theme={theme} lang={locale} dir={directionOf(locale)} className="flex min-w-0 flex-col gap-3 rounded-card bg-canvas p-5 text-fg">
      {label ? <div dir="ltr" className="text-caption font-semibold text-fg-subtle">{label}</div> : null}
      <OrgtikProvider locale={locale}>
        <TooltipProvider>{children}</TooltipProvider>
      </OrgtikProvider>
    </div>
  );
}

const withOrgtik: Decorator = (Story, ctx) => {
  const { theme, locale, layout } = ctx.globals as { theme: string; locale: Locale; layout: string };
  // Overlays render in portals on <body>, so the page itself follows the toolbar too.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", layout === "matrix" ? "light" : theme);
    html.setAttribute("lang", layout === "matrix" ? "en" : locale);
    html.setAttribute("dir", layout === "matrix" ? "ltr" : directionOf(locale));
  }, [theme, locale, layout]);
  if (layout === "matrix") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {(["light", "dark"] as const).flatMap((th) =>
          (["en", "ar"] as const).map((l) => (
            <Frame key={th + l} theme={th} locale={l} label={`${l.toUpperCase()} · ${th}`}>
              <Story />
            </Frame>
          )),
        )}
      </div>
    );
  }
  return (
    <Frame theme={theme} locale={locale}>
      <Story />
    </Frame>
  );
};

const preview: Preview = {
  decorators: [withOrgtik],
  parameters: { layout: "fullscreen", controls: { expanded: true } },
  initialGlobals: { theme: "light", locale: "en", layout: "single" },
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: { title: "Theme", icon: "mirror", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }], dynamicTitle: true },
    },
    locale: {
      description: "Language and direction",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "ar", title: "العربية (RTL)" },
          { value: "de", title: "Deutsch" },
          { value: "fr", title: "Français" },
          { value: "it", title: "Italiano" },
        ],
        dynamicTitle: true,
      },
    },
    layout: {
      description: "One frame, or the 2×2 matrix (light/dark × EN/AR)",
      toolbar: { title: "Layout", icon: "grid", items: [{ value: "single", title: "Single" }, { value: "matrix", title: "Matrix 2×2" }], dynamicTitle: true },
    },
  },
};
export default preview;
