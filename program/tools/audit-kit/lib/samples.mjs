// Sample paths for dynamic routes that no page links to. Public links reach people by email or
// chat, so the sweep can't find them in the DOM; they're built from the mocks' deterministic
// seeds instead. Each entry returns a path without the locale prefix.
import { createRequire } from "node:module";
import path from "node:path";
import { WORKSPACE } from "./suite.mjs";

const require = createRequire(import.meta.url);

export const SAMPLES = {
  files: {
    // An active link with no password. The seed also has password, expired and revoked links.
    "/share/:shareId": () => {
      const { SHARES, shareSecret } = require(path.join(WORKSPACE, "local-dev", "apps", "files", "seed.js"));
      const s = SHARES.find((x) => !x.password && x.revokedDays == null && x.expiresInDays > 0);
      return `/share/${s.id}?secret=${shareSecret(s.id)}`;
    },
  },
  chats: {
    // Guest links carry the meeting id; mt-1 is the first upcoming meeting in somion-hq/mock/seed.ts.
    "/guest/:token": () => "/guest/mt-1",
  },
};

export const sampleFor = (app, route) => SAMPLES[app]?.[route]?.() ?? null;
