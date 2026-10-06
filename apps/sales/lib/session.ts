import { cookies } from "next/headers";
import { TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import type { IAuthState } from "@/types/auth";

/** The signed-in person as the server sees them (the same cookies the browser reads). */
export async function readSession(): Promise<IAuthState> {
  const jar = await cookies();
  const parse = (raw: string | undefined) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      // A corrupt cookie used to crash the whole app at load: now it's simply no session.
      return null;
    }
  };
  const token = parse(jar.get(TOKEN_COOKIE)?.value) ?? jar.get(TOKEN_COOKIE)?.value ?? null;
  return { user: parse(jar.get(USER_COOKIE)?.value), token: typeof token === "string" ? token.replace(/"/g, "") : null };
}
