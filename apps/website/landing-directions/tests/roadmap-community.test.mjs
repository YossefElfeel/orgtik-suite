import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/content/snapshot.js";
import { refreshCommunity } from "../src/content/roadmap-community.js";
import { sendIdeaComment } from "../src/content/forms.js";

const original = structuredClone(snapshot.ideas);
afterEach(() => snapshot.ideas.splice(0, snapshot.ideas.length, ...structuredClone(original)));
const idea = { id: "published-idea", order: 1, status: "open", title: "Published idea", theme: "Products", body: "An approved suggestion", votes: 0, comments: 1, discussion: [{ id: "approved-comment", author: "Visitor", body: "Useful discussion", submittedAt: "2026-10-15T10:00:00Z" }] };

test("the community board refreshes moderated ideas and their approved discussion independently", async () => {
  let request;
  await refreshCommunity({ api: "https://cms.fixture/v2/", fetcher: async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ data: [idea] }) }; } });
  assert.equal(request.url, "https://cms.fixture/v2/public/ideas"); assert.equal(request.options.cache, "no-store");
  assert.deepEqual(snapshot.ideas, [idea]);
  await refreshCommunity({ api: "https://cms.fixture/v2", fetcher: async () => ({ ok: true, json: async () => ({ data: [] }) }) });
  assert.deepEqual(snapshot.ideas, []);
});

test("an offline, malformed or cancelled refresh preserves the previous community board", async () => {
  for (const data of [[{ ...idea, status: "pending" }], [{ ...idea, discussion: [{}] }], [idea, idea], {}]) {
    await assert.rejects(refreshCommunity({ fetcher: async () => ({ ok: true, json: async () => ({ data }) }) }));
    assert.deepEqual(snapshot.ideas, original);
  }
  await assert.rejects(refreshCommunity({ fetcher: async () => { throw Error("Offline"); } }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(refreshCommunity({ signal: controller.signal, fetcher: async () => ({ ok: true, json: async () => ({ data: [] }) }) }));
  assert.deepEqual(snapshot.ideas, original);
});

test("visitor comments send explicit consent and a stable retry key to their own idea", async () => {
  const previous = globalThis.fetch; let request;
  try {
    globalThis.fetch = async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ data: { id: "comment-new", status: "pending" } }) }; };
    const fields = { name: "Visitor", email: "visitor@fixture.test", message: "A useful comment", consent: true };
    assert.equal((await sendIdeaComment("published-idea", fields, "retry-comment")).data.status, "pending");
    assert.ok(request.url.endsWith("/public/ideas/published-idea/comments")); assert.equal(request.options.headers["Idempotency-Key"], "retry-comment");
    assert.deepEqual(JSON.parse(request.options.body), { ...fields, privacyVersion: "0.2" });
    await assert.rejects(sendIdeaComment("published-idea", { ...fields, consent: false }), /consent/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: { status: "pending" } }) });
    await assert.rejects(sendIdeaComment("published-idea", fields, "retry-comment"), /invalid receipt/);
  } finally { globalThis.fetch = previous; }
});
