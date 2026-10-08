export type MarketingPerson = { id: string; name: string; email: string; consent: boolean };
export type MarketingPost = { id: string; title: string; state: "draft" | "scheduled" | "delivered"; at: string };
export type MarketingReply = { id: string; body: string; actor: string };
export type MarketingCampaign = { id: string; name: string; page: "pg_partners"; workspace: string };
export type MarketingScene = { people: MarketingPerson[]; leads: { id: string; name: string; source: string; campaign?: string }[]; campaign?: MarketingCampaign; emailFormat?: { bold: boolean; italic: boolean; bullets: boolean }; sent: number; opened: number; clicked: number; replies: MarketingReply[]; posts: MarketingPost[]; journey: { delay: number; active: boolean; logs: string[] }; editor?: MarketingEditor };
export type MarketingEditor = { headline: string; body: string; cta: string; direction: "ltr" | "rtl"; campaignName: string; reply: string; topic: string; voice: "warm" | "direct"; delay: string; postTitle: string };
