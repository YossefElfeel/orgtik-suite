export type FilePermission = "view" | "comment" | "edit";
export interface PresentationFile {
  id: string; name: string; kind: "image" | "document" | "board"; folder: string; size: number;
  versions: { id: number; name: string; date: string }[];
  shares: { person: string; permission: FilePermission }[];
  comments: { id: string; person: string; text: string }[];
}
export const FILE_PEOPLE = ["Nour Khaled", "Rana Saad", "Omar Farouk", "Salma Nabil", "Mona Adel", "Hoda Ashraf", "Hany Samir"];
export const FILE_FOLDERS = ["library", "campaign", "people"];
export function seedPresentationFiles(workspace: string): PresentationFile[] {
  if (workspace === "new") return [];
  const prefix = ({ orgtik: "OrgTik", nile: "Nile Studio", spree: "Spree", desert: "Desert" } as Record<string, string>)[workspace] ?? "Nile Studio";
  return [
    { id: "brand", name: `${prefix} — brand board.svg`, kind: "image", folder: "library", size: 2, versions: [{ id: 2, name: "brand-v2.svg", date: "2026-10-07" }, { id: 1, name: "brand-v1.svg", date: "2026-10-01" }], shares: [{ person: FILE_PEOPLE[1], permission: "comment" }], comments: [] },
    { id: "brief", name: `${prefix} — launch brief.txt`, kind: "document", folder: "campaign", size: 1, versions: [{ id: 1, name: "launch-brief.txt", date: "2026-10-07" }], shares: [], comments: [] },
    { id: "board", name: `${prefix} — planning board`, kind: "board", folder: "campaign", size: 1, versions: [{ id: 1, name: "planning-board.json", date: "2026-10-07" }], shares: [{ person: FILE_PEOPLE[0], permission: "edit" }], comments: [] },
  ];
}
export function uniqueFileName(name: string, files: PresentationFile[], folder: string): string {
  const dot = name.lastIndexOf("."), stem = dot > 0 ? name.slice(0, dot) : name, extension = dot > 0 ? name.slice(dot) : "";
  let copy = `${stem} (2)${extension}`, count = 2;
  while (files.some(file => file.folder === folder && file.name.toLocaleLowerCase() === copy.toLocaleLowerCase())) copy = `${stem} (${++count})${extension}`;
  return copy;
}
