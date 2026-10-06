// Seats (USR-14, G-04 switch). Guests are free. Under model A every active member or admin is one
// seat on every per-user line; under B a per-user line counts only the people with access to its
// tool. An invitation counts once it's accepted.
import type { PerUserLine, SeatModel, TeamMember } from "@/redux/features/platform/team";
import type { WorkspaceRole } from "@/redux/features/platform/platformApi";

export const paysSeat = (role: WorkspaceRole) => role !== "guest";
const hasTool = (tools: string[] | null, tool: string) => tools === null || tools.includes(tool);

/** Seats a per-user line bills now. */
export function seatsOn(line: PerUserLine, model: SeatModel, members: TeamMember[], workspaceSeats: number) {
  if (model !== "B") return workspaceSeats;
  return members.filter((m) => m.status === "active" && paysSeat(m.role) && hasTool(m.tools, line.tool)).length;
}

/** The per-user lines one more seat lands on, for someone with this role and tools. */
export function linesFor(lines: PerUserLine[], model: SeatModel, role: WorkspaceRole, tools: string[] | null) {
  if (!paysSeat(role)) return [];
  return model === "B" ? lines.filter((l) => hasTool(tools, l.tool)) : lines;
}

export const sumUnits = (lines: PerUserLine[]) => lines.reduce((s, l) => s + l.unit, 0);
