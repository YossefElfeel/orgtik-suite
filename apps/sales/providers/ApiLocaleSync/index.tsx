"use client";

import { getCookie, setCookie } from "cookies-next";
import { useLocale } from "next-intl";
import { useLayoutEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { NEXT_LOCALE } from "@/constants";
import type { Locale } from "@/i18n/routing";
import { API_TAG_TYPES, baseApi } from "@/redux/app/baseApi";

export default function ApiLocaleSync() {
  const locale = useLocale() as Locale;
  const dispatch = useDispatch();
  const previousLocale = useRef<Locale | null>(null);

  useLayoutEffect(() => {
    const storedLocale = getCookie(NEXT_LOCALE) as Locale | undefined;
    setCookie(NEXT_LOCALE, locale);

    const localeChanged =
      previousLocale.current !== null && previousLocale.current !== locale;
    const cookieMismatch = storedLocale !== locale;

    if (localeChanged || cookieMismatch) {
      dispatch(baseApi.util.invalidateTags([...API_TAG_TYPES]));
    }

    previousLocale.current = locale;
  }, [dispatch, locale]);

  return null;
}
