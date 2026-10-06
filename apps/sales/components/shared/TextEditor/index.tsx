"use client";
import { useTranslations } from "next-intl";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ icon, label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border border-transparent text-secondary transition-colors hover:bg-muted",
        active && "border-primary/20 bg-primary/10 text-primary",
      )}
    >
      <Icon icon={icon} className="size-4" />
    </button>
  );
}

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function TextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  className,
}: Props) {
  
  const tCommon = useTranslations("common");
const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-28 w-full min-w-[280px] px-3 py-2 text-sm text-secondary outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }: any) => {
      onChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const nextValue = value || "";
    if (currentHtml !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-28 w-full min-w-[280px] rounded-lg border border-border bg-muted/20",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full min-w-[280px] overflow-hidden rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-2">
        <ToolbarButton
          icon="solar:text-bold-linear"
          label={tCommon("bold")}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon="solar:text-italic-linear"
          label={tCommon("italic")}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon="solar:text-underline-linear"
          label={tCommon("underline")}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon="solar:text-cross-linear"
          label={tCommon("strike")}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon="solar:text-square-linear"
          label={tCommon("heading1")}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolbarButton
          icon="solar:text-field-linear"
          label={tCommon("heading2")}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          icon="solar:quote-up-linear"
          label={tCommon("quote")}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon="solar:minus-linear"
          label={tCommon("horizontalRule")}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          icon="solar:list-linear"
          label={tCommon("bulletList")}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon="solar:sort-by-alphabet-linear"
          label={tCommon("orderedList")}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon="solar:undo-left-linear"
          label={tCommon("undo")}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon="solar:undo-right-linear"
          label={tCommon("redo")}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      <EditorContent
        editor={editor}
        className="min-h-28 w-full min-w-[280px] [&_.ProseMirror]:min-h-28 [&_.ProseMirror]:w-full [&_.ProseMirror]:min-w-[280px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap]:min-h-28 [&_.tiptap]:w-full [&_.tiptap]:min-w-[280px]"
      />
    </div>
  );
}
