import { cookies } from "next/headers";
import { TOKEN_COOKIE, USER_COOKIE } from "@/constants";
import type { IAuthState } from "@/types/user";

/** The signed-in person as the server sees them (the same cookies the browser reads). */
export async function readSession(): Promise<IAuthState> {
  const jar = await cookies();
  const parse = (raw: string | undefined) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const token = parse(jar.get(TOKEN_COOKIE)?.value);
  return { user: parse(jar.get(USER_COOKIE)?.value), token: typeof token === "string" ? token : null };
}
