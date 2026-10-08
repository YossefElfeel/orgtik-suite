export type DemoMessage = { id: string; channel: string; author: string; body: string; bold?: boolean; file?: string; saved?: boolean; reminder?: boolean; task?: string; scheduled?: boolean };
export type ChatScene = { channels: string[]; messages: DemoMessage[]; read: string[] };
export const sceneKey = (workspace: string) => `orgtik:presentation:chats:${workspace}`;
export function seedScene(workspace: string): ChatScene {
  if (workspace === "new") return { channels: [], messages: [], read: [] };
  return {
    channels: ["launch-review", "design-team", "announcements"], read: ["launch-review"],
    messages: [
      { id: "seed-1", channel: "launch-review", author: "Mona Adel", body: "The updated partner page is ready. Can we review the handoff together?", file: "partner-brief.pdf" },
      { id: "seed-2", channel: "launch-review", author: "Nour Khaled", body: "I’ve checked the mobile layout. Let’s turn the remaining feedback into tasks." },
      { id: "seed-3", channel: "design-team", author: "Rana Saad", body: "The component review is ready for the next design sync." },
      { id: "seed-4", channel: "announcements", author: "Mona Adel", body: "Our stakeholder walkthrough is scheduled for Thursday." },
    ],
  };
}
export const personaNames: Record<string, string> = { current: "Nour Khaled", mona: "Mona Adel", nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", hoda: "Hoda Ashraf", hany: "Hany Samir" };
export const workspaceNames: Record<string, string> = { current: "Nile Studio", nile: "Nile Studio", orgtik: "OrgTik", spree: "Spree Atelier", desert: "Desert Works", new: "New workspace" };
