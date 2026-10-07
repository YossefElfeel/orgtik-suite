import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/constants";
import type { IAuthState } from "@/types/user";

/** A server cookie may hint at a token; only the client API profile validates a bound session. */
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
  return { user: null, token: typeof token === "string" ? token : null };
}
