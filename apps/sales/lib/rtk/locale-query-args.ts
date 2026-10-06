import { skipToken } from "@reduxjs/toolkit/query";

export type LocaleAwareQueryParams = {
  /** Client-only RTK cache key segment; never sent to the API. */
  _locale?: string;
};

type LocaleQueryArg<T extends LocaleAwareQueryParams | void> =
  | T
  | typeof skipToken
  | undefined;

export function stripLocaleQueryArg<T extends LocaleAwareQueryParams | void>(
  params: T,
): Omit<NonNullable<T>, "_locale"> | undefined {
  if (!params) {
    return undefined;
  }

  const { _locale: _unusedLocale, ...apiParams } = params;
  void _unusedLocale;

  return apiParams as Omit<NonNullable<T>, "_locale">;
}

export function withLocaleQueryArg<T extends LocaleAwareQueryParams | void>(
  params: LocaleQueryArg<T>,
  locale: string,
): NonNullable<T> | { _locale: string } | typeof skipToken {
  if (params === skipToken) {
    return skipToken;
  }

  if (!params) {
    return { _locale: locale };
  }

  return { ...params, _locale: locale };
}
