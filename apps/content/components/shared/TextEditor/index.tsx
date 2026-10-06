"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  LinkIcon,
  CodeXml,
  Upload,
  X,
  CaseLower,
  Loader,
  Check,
  Heading4,
  Heading5,
  Heading6,
  Palette,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "./color-picker";
import { FloatingToolbar } from "./floating-toolbar";
import { useUploadImageMutation } from "@/redux/features/gallery/galleryApi";
import {
  HEADING_LEVELS,
  getEditorExtensions,
  getEditorProps,
  createTextColorHandlers,
  createHighlightColorHandlers,
  createLinkAttributes,
  addLinkToEditor,
  getLinkAttributesFromEditor,
  getEditorHtml,
  setEditorContent,
  getTextColorFromEditor,
  getHighlightColorFromEditor,
  isEditorContentEmpty,
  shouldUpdateEditorContent,
} from "./utils";

interface TextEditorProps {
  className?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function TextEditor({
  className,
  defaultValue,
  onChange,
}: TextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [showLinkInputs, setShowLinkInputs] = useState(false);
  const [showUploadInputs, setShowUploadInputs] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [linkText, setLinkText] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [rel, setRel] = useState("noopener noreferrer");
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("");
  const previousDefaultValueRef = useRef<string | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  const [uploadImageMutation] = useUploadImageMutation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(),
    content: defaultValue || "",
    editorProps: getEditorProps(),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (showHtmlEditor) setHtmlContent(html);
      onChange?.(html);
    },
  });

  const { handleSetTextColor: setTextColorUtil } =
    createTextColorHandlers(editor);
  const { handleSetHighlightColor: setHighlightColorUtil } =
    createHighlightColorHandlers(editor);

  const handleSetTextColor = useCallback(
    (color: string) => {
      setTextColorUtil(color);
      setTextColor(color);
    },
    [setTextColorUtil]
  );

  const handleSetHighlightColor = useCallback(
    (color: string) => {
      setHighlightColorUtil(color);
      setHighlightColor(color);
    },
    [setHighlightColorUtil]
  );

  const handleAddLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    const attributes = createLinkAttributes(
      linkUrl,
      openInNewTab,
      rel,
      linkTitle
    );
    addLinkToEditor(editor, linkUrl, linkText, attributes);
    setShowLinkInputs(false);
    setLinkText("");
    setLinkUrl("");
    setLinkTitle("");
    setOpenInNewTab(true);
    setRel("noopener noreferrer");
  }, [editor, linkUrl, openInNewTab, rel, linkTitle, linkText]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setAltText(e.target.files[0].name.split(".")[0] || "");
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !editor) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("alt", altText);

      const response = await uploadImageMutation(formData).unwrap();
      const imageUrl = response.data?.gallery?.image;

      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl, alt: altText }).run();
        resetUploadInputs();
      } else {
        throw new Error("Image URL not found in response");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadInputs = () => {
    setShowUploadInputs(false);
    setSelectedFile(null);
    setAltText("");
  };

  const toggleHtmlEditor = useCallback(() => {
    if (!editor) return;
    if (showHtmlEditor) {
      setEditorContent(editor, htmlContent);
    } else {
      setHtmlContent(getEditorHtml(editor));
    }
    setShowHtmlEditor(!showHtmlEditor);
  }, [editor, htmlContent, showHtmlEditor]);

  const openLinkInputsHandler = useCallback(() => {
    if (!editor) return;
    const linkAttrs = getLinkAttributesFromEditor(editor);
    setLinkUrl(linkAttrs.linkUrl);
    setLinkText(linkAttrs.linkText);
    setLinkTitle(linkAttrs.linkTitle);
    setOpenInNewTab(linkAttrs.openInNewTab);
    setRel(linkAttrs.rel);
    setShowLinkInputs(true);
  }, [editor]);

  const resetLinkInputs = useCallback(() => {
    setShowLinkInputs(false);
    setLinkUrl("");
    setLinkText("");
    setLinkTitle("");
    setOpenInNewTab(true);
    setRel("noopener noreferrer");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showLinkInputs && e.key === "Enter") {
        e.preventDefault();
        handleAddLink();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showLinkInputs, handleAddLink]);

  useEffect(() => {
    if (!editor) return;
    const handleSelectionUpdate = () => {
      setTextColor(getTextColorFromEditor(editor));
      setHighlightColor(getHighlightColorFromEditor(editor));
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleSelectionUpdate);
    };
  }, [editor]);

  // Update editor content when defaultValue changes (for initial load in edit mode)
  useEffect(() => {
    if (!editor) return;

    const previousValue = previousDefaultValueRef.current;
    const currentContent = getEditorHtml(editor);

    if (
      shouldUpdateEditorContent(currentContent, defaultValue, previousValue)
    ) {
      setEditorContent(editor, defaultValue || "");
      hasInitializedRef.current = true;
    }

    previousDefaultValueRef.current = defaultValue;
  }, [editor, defaultValue]);

  if (!editor) return null;

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="mx-4 mt-2 mb-0">
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b p-2 bg-background shadow-md rounded-xl">
          {/* Formatting buttons */}
          <Toggle
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            size="sm"
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            size="sm"
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
            size="sm"
            aria-label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            size="sm"
            aria-label="Strike"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            size="sm"
            aria-label="Code"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          {/* Text Color */}
          <ColorPicker value={textColor} onChange={handleSetTextColor}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Text Color"
              className="relative"
            >
              <Palette
                style={{
                  color: ["transparent", "#ffffff"].includes(
                    textColor.toLocaleLowerCase()
                  )
                    ? "black"
                    : textColor,
                }}
                className="h-4 w-4"
              />
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
                style={{
                  backgroundColor: textColor,
                }}
              />
            </Button>
          </ColorPicker>
          {/* Highlight Color */}
          <ColorPicker
            value={highlightColor}
            onChange={handleSetHighlightColor}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Highlight Color"
              className="relative"
            >
              <Highlighter
                className="h-4 w-4"
                style={{
                  color: ["transparent", "#ffffff"].includes(
                    highlightColor.toLocaleLowerCase()
                  )
                    ? "black"
                    : highlightColor,
                }}
              />
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
                style={{ backgroundColor: highlightColor }}
              />
            </Button>
          </ColorPicker>
          {/* Headings */}
          {HEADING_LEVELS.map((level) => (
            <Toggle
              key={level}
              pressed={editor.isActive("heading", { level })}
              onPressedChange={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as any })
                  .run()
              }
              size="sm"
              aria-label={`H${level}`}
            >
              {level === 1 ? (
                <Heading1 className="h-4 w-4" />
              ) : level === 2 ? (
                <Heading2 className="h-4 w-4" />
              ) : level === 3 ? (
                <Heading3 className="h-4 w-4" />
              ) : level === 4 ? (
                <Heading4 className="h-4 w-4" />
              ) : level === 5 ? (
                <Heading5 className="h-4 w-4" />
              ) : (
                <Heading6 className="h-4 w-4" />
              )}
            </Toggle>
          ))}
          {/* Lists */}
          <Toggle
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            size="sm"
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            size="sm"
            aria-label="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          {/* Other blocks */}
          <Toggle
            pressed={editor.isActive("blockquote")}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            size="sm"
            aria-label="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("codeBlock")}
            onPressedChange={() =>
              editor.chain().focus().toggleCodeBlock().run()
            }
            size="sm"
            aria-label="Code Block"
          >
            <CodeXml className="h-4 w-4" />
          </Toggle>
          {/* Undo / Redo */}
          <Button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            variant="ghost"
            size="sm"
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            variant="ghost"
            size="sm"
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
          {/* Link toggle */}
          <Toggle
            pressed={editor.isActive("link") || showLinkInputs}
            onPressedChange={() => {
              if (editor.isActive("link") && !showLinkInputs) {
                openLinkInputsHandler();
              } else if (editor.isActive("link") && showLinkInputs) {
                editor.chain().focus().unsetLink().run();
                resetLinkInputs();
              } else if (!editor.isActive("link") && !showLinkInputs) {
                openLinkInputsHandler();
              } else {
                resetLinkInputs();
              }
            }}
            size="sm"
            aria-label="Add or Edit Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
          {/* Upload */}
          <Button
            type="button"
            onClick={() => setShowUploadInputs(!showUploadInputs)}
            variant="ghost"
            size="sm"
            aria-label="Upload Image"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Floating Toolbar */}
      {editor && (
        <FloatingToolbar editor={editor} onLinkToggle={openLinkInputsHandler} />
      )}

      {/* Link Inputs */}
      {showLinkInputs && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b p-2 bg-muted/50">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="link-text" className="sr-only">
                Link Text
              </Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="link-url" className="sr-only">
                Link URL
              </Label>
              <Input
                id="link-url"
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="link-title" className="sr-only">
                Link Title (Optional)
              </Label>
              <Input
                id="link-title"
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Tooltip for SEO"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open-in-new-tab"
                checked={openInNewTab}
                onCheckedChange={(checked) => {
                  setOpenInNewTab(!!checked);
                  if (!checked) setRel("nofollow");
                }}
              />
              <Label
                htmlFor="open-in-new-tab"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Open in new tab
              </Label>
            </div>
            {!openInNewTab && (
              <div className="min-w-[120px]">
                <Label htmlFor="rel-attribute" className="sr-only">
                  Rel Attribute
                </Label>
                <Select value={rel} onValueChange={setRel}>
                  <SelectTrigger id="rel-attribute" className="h-9">
                    <SelectValue placeholder="Select rel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Rel Attributes</SelectLabel>
                      <SelectItem value="nofollow">nofollow</SelectItem>
                      <SelectItem value="ugc">ugc</SelectItem>
                      <SelectItem value="sponsored">sponsored</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex-center gap-2">
            <Button
              type="button"
              size="icon"
              onClick={handleAddLink}
              disabled={!linkUrl}
              className="size-8"
            >
              <Check />
            </Button>
            <div
              onClick={resetLinkInputs}
              className="bg-gray-200 flex-center rounded-full min-w-5 h-5 cursor-pointer"
            >
              <X className="size-3" />
              <span className="sr-only">Close</span>
            </div>
          </div>
        </div>
      )}
      {/* Image Upload Inputs */}
      {showUploadInputs && (
        <div className="flex flex-row items-center gap-2 border-b p-2 bg-muted/50">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="h-9 text-sm"
          />
          <Input
            type="text"
            placeholder="Alt text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="h-9 text-sm"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleConfirmUpload}
            disabled={!selectedFile || isUploading}
            className="h-8 min-w-8"
          >
            {isUploading ? <Loader className="animate-spin" /> : <Check />}
          </Button>
          <div
            className="bg-gray-200 flex-center rounded-full min-w-5 h-5 cursor-pointer"
            onClick={resetUploadInputs}
          >
            <X className="size-3" />
          </div>
        </div>
      )}
      {/* Editor or HTML toggle */}
      <div className="relative h-[350px] max-h-[350px] overflow-y-auto">
        {showHtmlEditor ? (
          <div className="p-4">
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              onBlur={() => editor?.commands.setContent(htmlContent)}
              className="w-full p-4 font-mono text-sm bg-muted text-foreground border rounded resize-none min-h-[350px]"
              style={{ height: "100%" }}
            />
          </div>
        ) : (
          <EditorContent editor={editor} className="p-4" />
        )}
        <div className="sticky w-full bottom-0 flex justify-end p-2">
          <Toggle
            className="bg-gray-100 border hover:text-zinc-800 hover:border-zinc-600"
            size="sm"
            pressed={showHtmlEditor}
            onPressedChange={toggleHtmlEditor}
            aria-label="Toggle HTML editor"
          >
            {showHtmlEditor ? (
              <CaseLower className="scale-125" />
            ) : (
              <CodeXml className="h-4 w-4" />
            )}
          </Toggle>
        </div>
      </div>
    </div>
  );
}
