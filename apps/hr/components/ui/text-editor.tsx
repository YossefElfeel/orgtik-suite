"use client";
import { ArrowElbowDownLeft as CornerDownLeft, List, ListNumbers as ListOrdered, Minus as SeparatorHorizontal, Signature, TextAlignCenter as AlignCenter, TextAlignJustify as AlignJustify, TextAlignLeft as AlignLeft, TextAlignRight as AlignRight, TextB as Bold, TextHOne as Heading1, TextHThree as Heading3, TextHTwo as Heading2, TextItalic as Italic, TextUnderline as Underline } from "@phosphor-icons/react";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CreateDocumentEditorProps = {
  placeholder?: string;
  className?: string;
  /** Sync with react-hook-form: initial HTML (e.g. after reset). */
  initialHtml?: string;
  /** Called when editor content changes. */
  onHtmlChange?: (html: string) => void;
  /** The field's name for screen readers (the textbox is a div, so a <label for> can't reach it). Falls back to the placeholder. */
  "aria-label"?: string;
  /** From the form field (FormControl): its id, hint/error and invalid state reach the textbox. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type ToolbarIconProps = {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  label: string;
  /**
   * Only for toggles (bold, a heading, an alignment): whether it's on, exposed as aria-pressed.
   * Leave it out for actions (line break, horizontal rule): they do something on every press.
   */
  isActive?: boolean;
  onClick?: () => void;
};

// The editor has content when it has text or something visible without text (a rule, a list item).
const isEditorEmpty = (editor: HTMLElement) =>
  (editor.textContent?.trim().length ?? 0) === 0 && !editor.querySelector("hr, img, li, table");

function ToolbarIcon({
  icon: Icon,
  label,
  isActive,
  onClick,
  className,
}: ToolbarIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
        isActive && "bg-muted text-foreground",
        className,
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon className="size-5" />
    </button>
  );
}

export function TextEditor({
  placeholder: placeholderProp,
  className,
  initialHtml = "",
  onHtmlChange,
  "aria-label": ariaLabel,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: CreateDocumentEditorProps) {
  const t = useTranslations("textEditor");
  const placeholder = placeholderProp ?? t("placeholder");
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    orderedList: false,
    unorderedList: false,
    align: "left" as "left" | "center" | "right" | "justify",
  });

  const isSelectionInsideEditor = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer);
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      !isSelectionInsideEditor()
    ) {
      return;
    }

    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, [isSelectionInsideEditor]);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    const savedRange = savedRangeRef.current;

    if (!selection || !savedRange) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(savedRange);
  }, []);

  const refreshToolbarState = useCallback(() => {
    if (!isSelectionInsideEditor()) {
      return;
    }

    const formatBlock = document
      .queryCommandValue("formatBlock")
      ?.toString()
      .toLowerCase()
      .replace(/[<>]/g, "");

    setActiveState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      h1: formatBlock === "h1",
      h2: formatBlock === "h2",
      h3: formatBlock === "h3",
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      align: document.queryCommandState("justifyCenter")
        ? "center"
        : document.queryCommandState("justifyRight")
          ? "right"
          : document.queryCommandState("justifyFull")
            ? "justify"
            : "left",
    });
  }, [isSelectionInsideEditor]);

  const runCommand = useCallback(
    (command: string, value?: string) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      editor.focus();
      restoreSelection();
      // Nothing selected in the editor yet (a toolbar press before any typing): work at the end
      // of the content, so the press always does something.
      const selection = window.getSelection();
      if (selection && !isSelectionInsideEditor()) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand(command, false, value);
      setIsEmpty(isEditorEmpty(editor));
      onHtmlChange?.(editor.innerHTML);
      saveSelection();
      refreshToolbarState();
    },
    [refreshToolbarState, restoreSelection, saveSelection, onHtmlChange, isSelectionInsideEditor],
  );

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (initialHtml !== undefined) {
      // Only update if the content is actually different to avoid cursor jumps
      if (editor.innerHTML !== initialHtml) {
        editor.innerHTML = initialHtml;
        setIsEmpty(isEditorEmpty(editor));
      }
    }
  }, [initialHtml]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const handleInput = () => {
      setIsEmpty(isEditorEmpty(editor));
      refreshToolbarState();
      onHtmlChange?.(editor.innerHTML);
    };

    const handleSelectionChange = () => {
      saveSelection();
      refreshToolbarState();
    };

    editor.addEventListener("input", handleInput);
    editor.addEventListener("mouseup", saveSelection);
    editor.addEventListener("keyup", saveSelection);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      editor.removeEventListener("input", handleInput);
      editor.removeEventListener("mouseup", saveSelection);
      editor.removeEventListener("keyup", saveSelection);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [refreshToolbarState, saveSelection, onHtmlChange]);

  return (
    <section
      className={cn(
        "w-full rounded-[10px] border border-border bg-card p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground">
        <div className="flex items-center gap-6">
          <ToolbarIcon
            icon={Bold}
            label={t("toolbar.bold")}
            isActive={activeState.bold}
            onClick={() => runCommand("bold")}
          />
          <ToolbarIcon
            icon={Italic}
            label={t("toolbar.italic")}
            isActive={activeState.italic}
            onClick={() => runCommand("italic")}
          />
          <ToolbarIcon
            icon={Underline}
            label={t("toolbar.underline")}
            isActive={activeState.underline}
            onClick={() => runCommand("underline")}
          />
        </div>

        <div className="flex items-center gap-6">
          <ToolbarIcon
            icon={Heading1}
            label={t("toolbar.heading1")}
            isActive={activeState.h1}
            onClick={() => runCommand("formatBlock", "<H1>")}
          />
          <ToolbarIcon
            icon={Heading2}
            label={t("toolbar.heading2")}
            isActive={activeState.h2}
            onClick={() => runCommand("formatBlock", "<H2>")}
          />
          <ToolbarIcon
            icon={Heading3}
            label={t("toolbar.heading3")}
            isActive={activeState.h3}
            onClick={() => runCommand("formatBlock", "<H3>")}
          />
        </div>

        <div className="flex items-center gap-6">
          <ToolbarIcon
            icon={ListOrdered}
            label={t("toolbar.numberedList")}
            isActive={activeState.orderedList}
            onClick={() => runCommand("insertOrderedList")}
          />
          <ToolbarIcon
            icon={List}
            label={t("toolbar.bulletedList")}
            isActive={activeState.unorderedList}
            onClick={() => runCommand("insertUnorderedList")}
          />
        </div>

        <div className="flex items-center gap-6">
          <ToolbarIcon
            icon={AlignLeft}
            label={t("toolbar.alignLeft")}
            isActive={activeState.align === "left"}
            onClick={() => runCommand("justifyLeft")}
          />
          <ToolbarIcon
            icon={AlignCenter}
            label={t("toolbar.alignCenter")}
            isActive={activeState.align === "center"}
            onClick={() => runCommand("justifyCenter")}
          />
          <ToolbarIcon
            icon={AlignRight}
            label={t("toolbar.alignRight")}
            isActive={activeState.align === "right"}
            onClick={() => runCommand("justifyRight")}
          />
          <ToolbarIcon
            icon={AlignJustify}
            label={t("toolbar.justify")}
            isActive={activeState.align === "justify"}
            onClick={() => runCommand("justifyFull")}
          />
        </div>

        <div className="flex items-center gap-6">
          <ToolbarIcon
            icon={CornerDownLeft}
            label={t("toolbar.lineBreak")}
            onClick={() => runCommand("insertHTML", "<br/>")}
          />
          <ToolbarIcon
            icon={SeparatorHorizontal}
            label={t("toolbar.horizontalRule")}
            onClick={() => runCommand("insertHorizontalRule")}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground outline-none"
              aria-label={t("toolbar.signatures")}
            >
              <Signature className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="flex items-end justify-between gap-12 mt-16 mb-8"><div class="flex-1 border-t-2 border-foreground pt-4"><p class="text-sm font-bold">Employer Signature</p><p class="text-xs text-muted-foreground">Name & Title</p></div><div class="flex-1 border-t-2 border-foreground pt-4"><p class="text-sm font-bold">Employee Signature</p><p class="text-xs text-muted-foreground">Date: ____ / ____ / ________</p></div></div><p></p>',
                  )
                }
              >
                {t("signatures.sideBySide")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="space-y-12 mt-16 mb-8"><div class="flex items-center gap-6"><span class="w-40 text-sm font-medium">For The Company :</span><div class="flex-1 border-b border-foreground"></div></div><div class="flex items-center gap-6"><span class="w-40 text-sm font-medium">For The Employee :</span><div class="flex-1 border-b border-foreground"></div></div></div><p></p>',
                  )
                }
              >
                {t("signatures.verticalList")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="mt-16 mb-8 max-w-sm"><div class="border-b-2 border-foreground h-10 w-full mb-2"></div><p class="text-sm font-bold uppercase tracking-widest">Employee Signature</p><p class="text-xs text-muted-foreground">Full Name & Date</p></div><p></p>',
                  )
                }
              >
                {t("signatures.single")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="grid grid-cols-3 gap-8 mt-16 mb-8"><div class="border-t-2 border-foreground pt-4"><p class="text-xs font-bold">Employer</p></div><div class="border-t-2 border-foreground pt-4"><p class="text-xs font-bold text-center">Witness</p></div><div class="border-t-2 border-foreground pt-4"><p class="text-xs font-bold text-right">Employee</p></div></div><p></p>',
                  )
                }
              >
                {t("signatures.threeColumns")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="-mb-1 ms-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground outline-none"
              aria-label={t("toolbar.quickStyles")}
            >
              <img src="/css.svg" className="size-5 opacity-50" alt="" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="flex items-center justify-between gap-4 p-4 border border-dashed border-border rounded-lg my-2"><div>Left Side</div><div>Right Side</div></div><p></p>',
                  )
                }
              >
                {t("quickStyles.flexBetween")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="grid grid-cols-2 gap-6 p-4 border border-dashed border-border rounded-lg my-2"><div>Column 1</div><div>Column 2</div></div><p></p>',
                  )
                }
              >
                {t("quickStyles.twoColumnGrid")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="p-4 border border-border bg-muted/30 rounded-xl my-4"><strong>Section Title</strong><p class="mt-2 text-sm text-muted-foreground">Detailed description or terms go here...</p></div><p></p>',
                  )
                }
              >
                {t("quickStyles.sectionCard")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runCommand(
                    "insertHTML",
                    '<div class="flex items-center gap-2 p-2 bg-primary/5 text-primary rounded-md my-2">✨ <span>Highlighted Note</span></div><p></p>',
                  )
                }
              >
                {t("quickStyles.infoNote")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="my-6 h-px w-full bg-border" />

      <div className="relative min-h-[240px]">
        {isEmpty ? (
          <p className="pointer-events-none absolute start-0 top-0 text-base leading-5 font-normal text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[240px] text-base leading-5 font-normal text-foreground outline-none [&_h1]:text-[32px] [&_h1]:leading-[40px] [&_h1]:font-semibold [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-semibold [&_h3]:text-[20px] [&_h3]:leading-[28px] [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
          role="textbox"
          aria-multiline="true"
          id={id}
          aria-label={ariaLabel ?? placeholder}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />
      </div>
    </section>
  );
}
