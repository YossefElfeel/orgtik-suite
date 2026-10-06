// A person's display name: first and last name, else their username.
export const personName = (p: { firstName?: string | null; lastName?: string | null; username?: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username || "";
