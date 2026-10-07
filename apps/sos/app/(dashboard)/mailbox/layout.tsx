import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
export async function generateMetadata(): Promise<Metadata> { const t = await getTranslations('Mailbox'); return { title: t('title') }; }
// The recipient inbox remains available after sign-in even without an active customer workspace.
export default function MailboxLayout({ children }: { children: React.ReactNode }) { return children; }
