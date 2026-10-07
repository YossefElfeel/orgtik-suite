import type { InvitationDelivery, MockMail } from '@/redux/features/platform/mailbox';
/** Only the server's current pending opaque capability is actionable. Never a JWT/query token. */
export function invitationPath(delivery: Pick<InvitationDelivery, 'status' | 'delivery' | 'invitePath'>): string | null {
  return delivery.delivery === 'mock' && delivery.status === 'pending' && typeof delivery.invitePath === 'string' && /^\/invite\/[A-Za-z0-9_-]{43}$/.test(delivery.invitePath) ? delivery.invitePath : null;
}
export function mailboxInvitationPath(message: MockMail): string | null {
  return message.invitationStatus ? invitationPath({ status: message.invitationStatus, delivery: message.delivery, invitePath: message.invitePath }) : null;
}
export function newestFirst(messages: MockMail[]): MockMail[] { return [...messages].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)); }
