export type AccountFileReference = { workspaceId: string; fileId: string; versionId: string };
export type AccountFileItem = AccountFileReference & { name: string; mimetype: string; size: number; version: number };
export type WorkspaceBranding = { name: string; defaultLanguage: string; timeZone: string; logo: AccountFileReference | null };
