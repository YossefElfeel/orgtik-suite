import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, fromAcceptLanguage, isLocale, type AppLocale } from "./locale";
import { formatMessage, type Vars } from "./messages";

export type Messages = Record<string, string>;

/* The person's language: their choice in the suite cookie, else their browser's, else English. */
export async function readLocale(): Promise<AppLocale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : (fromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE);
}

export async function readMessages(locale: AppLocale): Promise<Messages> {
  return (await import(`../messages/${locale}.json`)).default as Messages;
}

/** t() for server components and metadata, with the same keys and fallbacks as the client's. */
export async function getT() {
  const locale = await readLocale();
  const messages = await readMessages(locale);
  return (key: string, defaultText: string, vars?: Vars) => formatMessage(messages[key] ?? defaultText, vars, locale);
}

/** A page's generateMetadata: its tab title in the reader's language ("Office · Chats"). */
export const titled = (key: string, text: string) => async (): Promise<Metadata> => ({ title: (await getT())(key, text) });
