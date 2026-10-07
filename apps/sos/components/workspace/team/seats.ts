import type { AppTool, WorkspaceRole } from '@/redux/features/platform/platformApi';
import type { PerToolSeats } from '@/redux/features/platform/team';
export const SUPPORTED_TOOLS = ['tasks', 'files', 'hr', 'crm', 'marketing', 'chat'] as const;
export function supportedTools(tools: AppTool[], counts: Record<string, PerToolSeats>, role: WorkspaceRole) {
  return tools.filter(tool => (SUPPORTED_TOOLS as readonly string[]).includes(tool.key) && tool.line && !['not_subscribed', 'coming_soon'].includes(tool.state) && counts[tool.key] && counts[tool.key].capacity !== 0 && !(role === 'guest' && tool.key === 'hr'));
}
export function selection(tools: AppTool[], counts: Record<string, PerToolSeats>, role: WorkspaceRole, value: string[] | null): string[] {
  const available = supportedTools(tools, counts, role).map(tool => tool.key);
  return value === null ? available : [...new Set(value)].filter(key => available.includes(key));
}
export function unavailableCapacity(counts: Record<string, PerToolSeats>, tools: string[], alreadyAssigned: string[] = []): string[] {
  return tools.filter(tool => !alreadyAssigned.includes(tool) && (!counts[tool] || counts[tool].capacity !== null && (counts[tool].available ?? 0) < 1));
}
export function membershipSeatState(status: string): 'assigned' | 'reserved' { return status === 'active' ? 'assigned' : 'reserved'; }
