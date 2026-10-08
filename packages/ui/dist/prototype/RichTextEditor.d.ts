export type RichTextFormat = {
    bold: boolean;
    italic: boolean;
    bullets: boolean;
};
/** Plain text with explicit formatting flags; never interprets user HTML. */
export declare function RichTextEditor({ label, value, onChange, format, onFormatChange, placeholder, disabled, rows, maxLength, error, onBlur }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    format: RichTextFormat;
    onFormatChange: (format: RichTextFormat) => void;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
    error?: string;
    onBlur?: () => void;
}): import("react").JSX.Element;
//# sourceMappingURL=RichTextEditor.d.ts.map