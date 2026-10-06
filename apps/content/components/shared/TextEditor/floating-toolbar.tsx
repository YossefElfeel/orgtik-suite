"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  LinkIcon,
  Code,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { NodeSelection } from "prosemirror-state"; // Import NodeSelection

interface FloatingToolbarProps {
  editor: Editor;
  onLinkToggle: () => void; // Callback to open/close the main link input bar
}

export function FloatingToolbar({
  editor,
  onLinkToggle,
}: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const { selection } = editor.state;
    const { empty, from, to } = selection;

    // Hide if no text is selected or if it's a node selection (e.g., an image)
    // Using instanceof NodeSelection for type-safe check
    if (empty || selection instanceof NodeSelection) {
      setIsVisible(false);
      return;
    }

    const text = editor.state.doc.textBetween(from, to);
    // Hide if only whitespace is selected
    if (!text.trim()) {
      setIsVisible(false);
      return;
    }

    const selectionRect = window
      .getSelection()
      ?.getRangeAt(0)
      ?.getBoundingClientRect();

    if (selectionRect) {
      const toolbarHeight = toolbarRef.current?.offsetHeight || 0;

      // Position above the selection, centered horizontally
      const top = selectionRect.top + window.scrollY + toolbarHeight + 30; // 10px padding above selection
      const left = selectionRect.left + selectionRect.width / 2;

      setPosition({ top, left });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    // Update toolbar visibility and position on selection changes and editor focus
    editor.on("selectionUpdate", updateToolbar);
    editor.on("focus", updateToolbar);
    // Hide toolbar when editor loses focus
    editor.on("blur", () => setIsVisible(false));

    // Also update on scroll to keep position correct
    const handleScroll = () => {
      if (isVisible) {
        updateToolbar();
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("focus", updateToolbar);
      editor.off("blur", () => setIsVisible(false));
      window.removeEventListener("scroll", handleScroll);
    };
  }, [editor, updateToolbar, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex flex-wrap items-center gap-1 rounded-md border bg-popover p-1 shadow-md transition-opacity duration-200"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)", // Center horizontally
      }}
    >
      <Toggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        size="sm"
        aria-label="Bold"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        size="sm"
        aria-label="Italic"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        size="sm"
        aria-label="Underline"
        onMouseDown={(e) => e.preventDefault()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        size="sm"
        aria-label="Strike"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        size="sm"
        aria-label="Code"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("link")}
        onPressedChange={onLinkToggle}
        size="sm"
        aria-label="Add or Edit Link"
        onMouseDown={(e) => e.preventDefault()}
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
