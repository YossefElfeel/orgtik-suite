import { AUTH_REDIRECT_URL } from "@/constants";
import { Locale } from "@/i18n/routing";

export const getUnauthorizedRedirectUrl = (locale: Locale = "en") => {
    if (AUTH_REDIRECT_URL.startsWith("/")) {
        return `/${locale}${AUTH_REDIRECT_URL}`;
    }
    return AUTH_REDIRECT_URL;
}