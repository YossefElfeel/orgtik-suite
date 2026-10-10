"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  DotsSixVertical,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Button, Field, IconButton, Input, Textarea } from "@orgtik/ui";
import { MediaPicker } from "@/components/media/MediaPicker";
import type { EditorContext } from "./BlockEditor";

type Block = {
  id: string;
  kind: "text" | "image" | "video";
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
};
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  blocks: Block[];
};

// Deterministic IDs let existing paragraphs keep their translations during the first edit.
const normalize = (value: unknown): Section[] =>
  Array.isArray(value)
    ? value.map((section, index) => ({
        ...section,
        id: section.id ?? `section-${index}`,
        heading: section.heading ?? "",
        blocks:
          section.blocks ??
          (section.paragraphs ?? []).map((text: string, n: number) => ({
            id: `paragraph-${n}`,
            kind: "text",
            text,
          })),
      }))
    : [];

export function synchronizeArticleEdits(
  value: unknown,
  previous: unknown,
  translation: unknown,
) {
  const before = normalize(previous),
    words = normalize(translation);
  return normalize(value).map((section) => {
    const index = before.findIndex((item) => item.id === section.id);
    const translated =
      words.find((item) => item.id === section.id) ??
      (index >= 0 ? words[index] : undefined);
    return {
      id: section.id,
      heading: translated?.heading ?? "",
      blocks: section.blocks.map((block) => {
        const text = translated?.blocks.find(
          (item) => item.id === block.id && item.kind === block.kind,
        );
        return block.kind === "text"
          ? { id: block.id, kind: block.kind, text: text?.text ?? "" }
          : {
              id: block.id,
              kind: block.kind,
              src: block.src,
              alt: text?.alt ?? "",
              caption: text?.caption ?? "",
            };
      }),
    };
  });
}

function moved<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || to >= items.length) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

export function ArticleBodyEditor({
  value,
  onChange,
  ctx,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  ctx: EditorContext;
}) {
  const t = useTranslations("Improvements");
  const tf = useTranslations("Fields");
  const sections = normalize(value);
  const [dragged, setDragged] = useState<{
    section: string;
    block?: string;
  } | null>(null);
  const update = (items: Section[]) =>
    onChange(items.map(({ paragraphs: _legacy, ...section }) => section));
  const editSection = (index: number, patch: Partial<Section>) =>
    update(
      sections.map((section, n) =>
        n === index ? { ...section, ...patch } : section,
      ),
    );
  const editBlock = (index: number, n: number, patch: Partial<Block>) =>
    editSection(index, {
      blocks: sections[index].blocks.map((block, i) =>
        i === n ? { ...block, ...patch } : block,
      ),
    });
  const insert = (index: number, at: number, kind: Block["kind"]) => {
    const blocks = [...sections[index].blocks];
    blocks.splice(at, 0, {
      id: crypto.randomUUID(),
      kind,
      ...(kind === "text" ? { text: "" } : { src: "", alt: "", caption: "" }),
    });
    editSection(index, { blocks });
  };
  const addControls = (index: number, at: number) =>
    ctx.structureLocked ? null : (
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label={t("insertHere")}
      >
        {(["text", "image", "video"] as const).map((kind) => (
          <Button
            key={kind}
            variant="ghost"
            size="sm"
            startIcon={<Plus />}
            onClick={() => insert(index, at, kind)}
          >
            {t(`add${kind[0].toUpperCase()}${kind.slice(1)}`)}
          </Button>
        ))}
      </div>
    );

  return (
    <section className="flex flex-col gap-5" aria-label={tf("sections")}>
      <p className="text-body-sm text-fg-muted">
        {t(
          ctx.structureLocked && !ctx.readOnly
            ? "articleLanguageHelp"
            : "articleBodyHelp",
        )}
      </p>
      {!sections.length ? (
        <p className="py-4 text-body-sm text-fg-muted">
          {t("noArticleSections")}
        </p>
      ) : null}
      {sections.map((section, index) => (
        <section
          key={section.id}
          aria-label={section.heading || `${tf("articleSection")} ${index + 1}`}
          className="flex flex-col gap-4 border-t border-line pt-5"
          onDragOver={(event) => {
            if (!ctx.structureLocked && dragged && !dragged.block)
              event.preventDefault();
          }}
          onDrop={(event) => {
            if (ctx.structureLocked || !dragged || dragged.block) return;
            event.preventDefault();
            update(
              moved(
                sections,
                sections.findIndex((item) => item.id === dragged.section),
                index,
              ),
            );
            setDragged(null);
          }}
        >
          <header className="flex flex-wrap items-center gap-3">
            {!ctx.structureLocked ? (
              <span
                draggable
                onDragStart={() => setDragged({ section: section.id })}
                onDragEnd={() => setDragged(null)}
                className="cursor-grab text-fg-muted"
                title={t("dragSection")}
              >
                <DotsSixVertical aria-hidden />
              </span>
            ) : null}
            <span className="flex-1 text-label">
              {tf("articleSection")} {index + 1}
            </span>
            {!ctx.structureLocked ? (
              <span className="flex gap-1">
                <IconButton
                  label={`${t("moveUp")}: ${tf("articleSection")} ${index + 1}`}
                  icon={<ArrowUp />}
                  disabled={index === 0}
                  onClick={() => update(moved(sections, index, index - 1))}
                />
                <IconButton
                  label={`${t("moveDown")}: ${tf("articleSection")} ${index + 1}`}
                  icon={<ArrowDown />}
                  disabled={index === sections.length - 1}
                  onClick={() => update(moved(sections, index, index + 1))}
                />
                <IconButton
                  label={`${t("remove")}: ${tf("articleSection")} ${index + 1}`}
                  icon={<Trash />}
                className="text-danger hover:bg-danger-subtle focus-visible:outline-danger"
                  onClick={() => update(sections.filter((_, n) => n !== index))}
                />
              </span>
            ) : null}
          </header>
          {ctx.readOnly ? (
            section.heading ? (
              <h3 className="font-display text-title-sm" dir="auto">
                {section.heading}
              </h3>
            ) : null
          ) : (
            <Field label={tf("heading")}>
              <Input
                value={section.heading}
                lang={ctx.lang}
                dir="auto"
                onChange={(event) =>
                  editSection(index, { heading: event.target.value })
                }
              />
            </Field>
          )}
          {addControls(index, 0)}
          {section.blocks.map((block, n) => (
            <div
              key={block.id}
              role="group"
              aria-label={`${t(block.kind)} ${n + 1}`}
              className="flex flex-col gap-3"
              onDragOver={(event) => {
                if (
                  !ctx.structureLocked &&
                  dragged?.block &&
                  dragged.section === section.id
                ) {
                  event.stopPropagation();
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                if (
                  ctx.structureLocked ||
                  !dragged?.block ||
                  dragged.section !== section.id
                )
                  return;
                event.preventDefault();
                event.stopPropagation();
                editSection(index, {
                  blocks: moved(
                    section.blocks,
                    section.blocks.findIndex(
                      (item) => item.id === dragged.block,
                    ),
                    n,
                  ),
                });
                setDragged(null);
              }}
            >
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {!ctx.structureLocked ? (
                  <span
                    draggable
                    onDragStart={(event) => {
                      event.stopPropagation();
                      setDragged({ section: section.id, block: block.id });
                    }}
                    onDragEnd={() => setDragged(null)}
                    title={t("dragBlock")}
                    className="cursor-grab text-fg-muted"
                  >
                    <DotsSixVertical aria-hidden />
                  </span>
                ) : null}
                <span className="flex-1 text-caption text-fg-muted">
                  {t(block.kind)} {n + 1}
                </span>
                {!ctx.structureLocked ? (
                  <span className="flex gap-1">
                    <IconButton
                      label={`${t("moveUp")}: ${t(block.kind)} ${n + 1}`}
                      icon={<ArrowUp />}
                      disabled={n === 0}
                      onClick={() =>
                        editSection(index, {
                          blocks: moved(section.blocks, n, n - 1),
                        })
                      }
                    />
                    <IconButton
                      label={`${t("moveDown")}: ${t(block.kind)} ${n + 1}`}
                      icon={<ArrowDown />}
                      disabled={n === section.blocks.length - 1}
                      onClick={() =>
                        editSection(index, {
                          blocks: moved(section.blocks, n, n + 1),
                        })
                      }
                    />
                    <IconButton
                      label={`${t("remove")}: ${t(block.kind)} ${n + 1}`}
                      icon={<Trash />}
                      className="text-danger hover:bg-danger-subtle focus-visible:outline-danger"
                      onClick={() =>
                        editSection(index, {
                          blocks: section.blocks.filter((_, i) => i !== n),
                        })
                      }
                    />
                  </span>
                ) : null}
              </div>
              {block.kind === "text" ? (
                ctx.readOnly ? (
                  <p className="whitespace-pre-wrap text-body" dir="auto">
                    {block.text}
                  </p>
                ) : (
                  <Field label={t("text")}>
                    <Textarea
                      rows={4}
                      value={block.text ?? ""}
                      lang={ctx.lang}
                      dir="auto"
                      onChange={(event) =>
                        editBlock(index, n, { text: event.target.value })
                      }
                    />
                  </Field>
                )
              ) : (
                <>
                  <MediaPicker
                    value={block.src ?? ""}
                    kind={block.kind}
                    disabled={ctx.structureLocked}
                    onChange={(src, media) =>
                      editBlock(index, n, {
                        src,
                        alt: media?.alt.en ?? block.alt ?? "",
                      })
                    }
                  />
                  {ctx.readOnly ? (
                    block.caption ? (
                      <p className="text-caption text-fg-muted" dir="auto">
                        {block.caption}
                      </p>
                    ) : null
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t("altText")}>
                        <Input
                          value={block.alt ?? ""}
                          lang={ctx.lang}
                          dir="auto"
                          onChange={(event) =>
                            editBlock(index, n, { alt: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={t("caption")}>
                        <Input
                          value={block.caption ?? ""}
                          lang={ctx.lang}
                          dir="auto"
                          onChange={(event) =>
                            editBlock(index, n, { caption: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}
              {addControls(index, n + 1)}
            </div>
          ))}
        </section>
      ))}
      {!ctx.structureLocked ? (
        <Button
          variant="secondary"
          startIcon={<Plus />}
          className="self-start"
          onClick={() =>
            update([
              ...sections,
              {
                id: crypto.randomUUID(),
                heading: "",
                blocks: [{ id: crypto.randomUUID(), kind: "text", text: "" }],
              },
            ])
          }
        >
          {t("addSection")}
        </Button>
      ) : null}
      {ctx.errors.sections ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("articleInvalid")}
        </p>
      ) : null}
    </section>
  );
}
