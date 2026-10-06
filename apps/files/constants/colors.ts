export const FOLDER_COLORS = {
  violet: { bg: "#ede9fe", light: "#f5f3ff", text: "#7c3aed" },
  blue: { bg: "#dbeafe", light: "#eff6ff", text: "#2563eb" },
  orange: { bg: "#ffedd5", light: "#fff7ed", text: "#ea580c" },
  cyan: { bg: "#cffafe", light: "#ecfeff", text: "#0891b2" },
} as const;

export type FolderColor = keyof typeof FOLDER_COLORS;
