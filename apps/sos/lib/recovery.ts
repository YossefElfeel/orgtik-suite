// Password recovery: the email moves from "forgot" to "reset" in this tab's session storage, never
// in the address. The cooldown before the code can be sent again.
export const RESET_EMAIL_KEY = "sos.reset-email";
export const RESEND_SECONDS = 60;
