import type { Editor } from "@tiptap/react";
import type { Level } from "@tiptap/extension-heading";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Heading from "@tiptap/extension-heading";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { CustomImage } from "./extensions/image-resize.extension";

const lowlight = createLowlight(common);

export const HEADING_LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

export const getEditorExtensions = () => [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
    heading: false,
  }),
  Heading.configure({ levels: HEADING_LEVELS }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  Placeholder.configure({
    placeholder: "Start writing your Notion-like document...",
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  CustomImage,
  CodeBlockLowlight.configure({ lowlight }),
  TextStyle,
  Color.configure({ types: ["textStyle", "bold", "listItem"] }),
  Highlight.configure({ multicolor: true }),
];

export const getEditorProps = () => ({
  attributes: {
    class:
      "prose max-w-none focus:outline-none p-4 min-h-[300px]",
  },
});

// Color handlers
export const createTextColorHandlers = (editor: Editor | null) => {
  const handleSetTextColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };

  const handleClearTextColor = () => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
  };

  return { handleSetTextColor, handleClearTextColor };
};

export const createHighlightColorHandlers = (editor: Editor | null) => {
  const handleSetHighlightColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const handleClearHighlightColor = () => {
    if (!editor) return;
    editor.chain().focus().unsetHighlight().run();
  };

  return { handleSetHighlightColor, handleClearHighlightColor };
};

// Link handlers
export interface LinkAttributes {
  href: string;
  target?: string;
  rel?: string;
  title?: string;
}

export const createLinkAttributes = (
  linkUrl: string,
  openInNewTab: boolean,
  rel: string,
  linkTitle: string
): LinkAttributes => {
  const attributes: LinkAttributes = {
    href: linkUrl,
    target: openInNewTab ? "_blank" : "_self",
    title: linkTitle || undefined,
  };

  if (openInNewTab) {
    attributes.rel = "noopener noreferrer";
  } else if (rel !== "none") {
    attributes.rel = rel;
  }

  return attributes;
};

export const addLinkToEditor = (
  editor: Editor,
  linkUrl: string,
  linkText: string,
  attributes: LinkAttributes
) => {
  editor.chain().focus();
  if (editor.state.selection.empty && linkText) {
    editor
      .chain()
      .insertContent({
        type: "text",
        text: linkText,
        marks: [{ type: "link", attrs: attributes }],
      })
      .run();
  } else {
    editor.chain().setLink(attributes).run();
  }
};

export const getLinkAttributesFromEditor = (editor: Editor) => {
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to);
  const existingAttrs = editor.getAttributes("link");

  if (editor.isActive("link")) {
    return {
      linkUrl: existingAttrs.href || "",
      linkText: selectedText || "",
      linkTitle: existingAttrs.title || "",
      openInNewTab: existingAttrs.target === "_blank",
      rel: existingAttrs.rel || "noopener noreferrer",
    };
  }

  return {
    linkUrl: "",
    linkText: selectedText || "",
    linkTitle: "",
    openInNewTab: true,
    rel: "noopener noreferrer",
  };
};


// HTML editor helpers
export const getEditorHtml = (editor: Editor | null): string => {
  return editor?.getHTML() || "";
};

export const setEditorContent = (editor: Editor | null, content: string) => {
  if (!editor) return;
  editor.commands.setContent(content);
};

// Color detection helpers
export const getTextColorFromEditor = (editor: Editor | null): string => {
  if (!editor) return "#000000";
  return editor.getAttributes("textStyle").color || "#000000";
};

export const getHighlightColorFromEditor = (editor: Editor | null): string => {
  if (!editor) return "";
  return editor.getAttributes("highlight").color || "";
};

// Content validation helpers
export const isEditorContentEmpty = (content: string): boolean => {
  return content === "<p></p>" || content === "" || content === "<p><br></p>";
};

export const shouldUpdateEditorContent = (
  currentContent: string,
  defaultValue: string | undefined,
  previousValue: string | undefined
): boolean => {
  if (!defaultValue || defaultValue.trim() === "") return false;

  const isInitialLoad =
    (!previousValue || previousValue === "") &&
    Boolean(defaultValue && defaultValue.trim() !== "");

  const isEmpty = isEditorContentEmpty(currentContent);

  return (
    (isInitialLoad ||
      (isEmpty && Boolean(defaultValue && defaultValue.trim() !== ""))) &&
    currentContent !== defaultValue
  );
};
