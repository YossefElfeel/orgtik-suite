// The platforms the wizard can connect. A wizard or callback address with anything else is a 404.
// No "use client": the route pages check it on the server.
export const CONNECTABLE = ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE", "GOOGLE"] as const;
export const isConnectable = (p: string | null | undefined) => CONNECTABLE.includes(String(p ?? "").toUpperCase() as (typeof CONNECTABLE)[number]);
