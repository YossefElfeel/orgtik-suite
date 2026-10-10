import type { SuitePreferences } from '@orgtik/ui';
export type ConsoleFrame = { staff: { id: number; name: string }; preferences: SuitePreferences; now: string; scope: 'staff:admin' };
export type ConsoleMetrics = { mrrUsd: number; activeWorkspaces: number; trials: number; activation: { activated: number; eligible: number }; cohorts: { month: string; workspaces: number; paying: number; mrrUsd: number }[]; movements: { id: string; at: string; workspaceId: string; kind: string; amountUsd: number }[]; definitions: { currency: string; conversion: string; mrr: string; cohorts: string } };
export type ConsoleRelease = { id: string; tool: string; kind: 'release' | 'changelog' | 'announcement'; title: string; body: string; version: string; publishedAt: string; by: string; status: string };
export type ConsoleConnector = { id: string; source: string; target: string; data: string[]; workspaces: { id: string; name: string; enabled: boolean }[] };
