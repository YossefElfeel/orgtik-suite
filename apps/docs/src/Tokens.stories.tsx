import type { Meta, StoryObj } from "@storybook/react-vite";
import { tokens } from "@orgtik/ui";

const meta: Meta = { title: "Foundations/Tokens", parameters: { layout: "padded" } };
export default meta;

// Swatches read the live CSS variables, so each frame shows its own theme.
function Colors() {
  const names = Object.keys(tokens.semantic.light);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {names.map((n) => (
        <div key={n} className="flex items-center gap-3 rounded-field border border-line bg-raised p-2">
          <span className="size-9 shrink-0 rounded-field border border-line" style={{ background: `var(--ot-${n})` }} />
          <code dir="ltr" className="truncate text-caption text-fg-muted">--ot-{n}</code>
        </div>
      ))}
    </div>
  );
}
export const SemanticColors: StoryObj = { render: () => <Colors /> };

const SAMPLE = { en: "Every workspace, one suite", ar: "كل مساحات العمل في منصة واحدة" };

function Type() {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(tokens.type).map(([role, t]) => (
        <div key={role} className="flex flex-col gap-1 border-b border-line pb-3">
          <code dir="ltr" className="text-start text-caption text-fg-subtle">
            text-{role} · {t.size} / {t.line} · {t.weight} · {t.family}
          </code>
          <div className={t.family === "display" ? "font-display" : "font-body"} style={{ fontSize: `var(--ot-type-${role}-size)`, lineHeight: `var(--ot-type-${role}-line)`, letterSpacing: `var(--ot-type-${role}-tracking)`, fontWeight: `var(--ot-type-${role}-weight)` }}>
            <span lang="en">{SAMPLE.en}</span> · <span lang="ar">{SAMPLE.ar}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
/** Each role sets size, line height, tracking and weight together; Arabic gets no tracking and taller lines. */
export const TypeRoles: StoryObj = { render: () => <Type /> };
