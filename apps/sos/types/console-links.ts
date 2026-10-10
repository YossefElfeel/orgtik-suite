import type { InvoiceState } from '@/redux/features/platform/billing';
export type OwnerPayLink = { id: string; canPay: boolean; invoice: { id: string; number: string; state: InvoiceState; total: number; currency: string }; paymentMethods: { id: string; kind: string; last4?: string }[] };
export type StaffInvitation = { id: string; name: string; email: string; roles: string[]; state: 'pending' | 'accepted' | 'cancelled'; expiresAt: string; sessionAction?: 'signed_out' };
export type OwnerPaymentAttempt = { paymentMethodId: string; operationId: string };
