const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function transpile(file, context) {
  const output = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { module: output, exports: output.exports, URL, ...context },
    { filename: file },
  );
  return output.exports;
}
const urls = transpile(
  path.resolve(__dirname, "../../../packages/ui/src/auth/urls.ts"),
  { process: { env: { NEXT_PUBLIC_BASE_PATH: "/wm" } } },
);
let sdkCalls = [];
const { sectionPreviewAuthUrl, openSectionPreview } = transpile(
  path.join(__dirname, "sectionPreviewTab.ts"),
  {
    require: (name) =>
      name === "@orgtik/ui/auth"
        ? {
            ...urls,
            handoffCode: async (...args) => {
              sdkCalls.push(args);
              return "one-use-code";
            },
          }
        : name === "./env"
          ? { SOS_API: "https://suite.test/api" }
          : { getToken: () => "staff-access-token" },
  },
);
function popup(events = []) {
  return {
    closed: false,
    set opener(value) {
      events.push(["opener", value]);
    },
    location: { replace: (url) => events.push(["navigate", url]) },
    close() {
      this.closed = true;
      events.push(["close"]);
    },
  };
}
const options = {
  href: "/preview?path=%2Fde%2Fservices&lang=de&section=id%3Asvc-builder",
  locale: "ar",
  origin: "https://wm.test",
};

test("new-tab handoff retains the WM base path, UI locale and independently selected content locale", async () => {
  sdkCalls = [];
  const events = [],
    tab = popup(events);
  await openSectionPreview({
    ...options,
    openWindow: () => {
      events.push(["open"]);
      return tab;
    },
  });
  assert.deepEqual(sdkCalls, [
    ["https://suite.test/api", "staff-access-token", "staff:wm"],
  ]);
  assert.deepEqual(events.slice(0, 2), [["open"], ["opener", null]]);
  const destination = new URL(events.find(([type]) => type === "navigate")[1]);
  assert.equal(destination.origin, "https://wm.test");
  assert.equal(destination.pathname, "/wm/ar/auth");
  assert.equal(destination.searchParams.get("redirect"), options.href);
  assert.equal(destination.searchParams.get("code"), "one-use-code");
  assert.equal(destination.href.includes("staff-access-token"), false);
  assert.equal(tab.closed, false);
});

test("the blank tab opens and its opener is detached synchronously before the handoff finishes", async () => {
  const events = [],
    tab = popup(events);
  let complete;
  const opening = openSectionPreview({
    ...options,
    openWindow: () => {
      events.push(["open"]);
      return tab;
    },
    requestCode: () =>
      new Promise((resolve) => {
        events.push(["handoff"]);
        complete = resolve;
      }),
  });
  assert.deepEqual(events, [["open"], ["opener", null], ["handoff"]]);
  complete("one-use-code");
  await opening;
  assert.equal(events.at(-1)[0], "navigate");
});

test("blocked popups never request handoff credentials or replace the editor", async () => {
  let requested = false;
  await assert.rejects(
    openSectionPreview({
      ...options,
      openWindow: () => null,
      requestCode: async () => {
        requested = true;
        return "code";
      },
    }),
    /preview_popup_blocked/,
  );
  assert.equal(requested, false);
});

test("handoff failures close the blank window and leave the source session untouched", async () => {
  const events = [],
    tab = popup(events);
  await assert.rejects(
    openSectionPreview({
      ...options,
      openWindow: () => tab,
      requestCode: async () => {
        throw new Error("offline");
      },
    }),
    /offline/,
  );
  assert.equal(tab.closed, true);
  assert.equal(
    events.some(([type]) => type === "navigate"),
    false,
  );
});

test("a changed source session cancels navigation and closes the preview tab", async () => {
  const events = [],
    tab = popup(events);
  let current = "first-session",
    complete;
  const opening = openSectionPreview({
    ...options,
    openWindow: () => tab,
    token: () => current,
    requestCode: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  });
  current = "second-session";
  complete("first-session-code");
  await assert.rejects(opening, /session_changed/);
  assert.equal(tab.closed, true);
  assert.equal(
    events.some(([type]) => type === "navigate"),
    false,
  );
});

test("missing staff credentials and invalid redirects cannot open an authenticated destination", async () => {
  const tab = popup();
  await assert.rejects(
    openSectionPreview({
      ...options,
      openWindow: () => tab,
      token: () => null,
    }),
    /staff_access_required/,
  );
  assert.equal(tab.closed, true);
  for (const href of [
    "https://other.test/preview",
    "//other.test/preview",
    "/\\other.test/preview",
    "/settings",
    "/preview/../settings",
  ]) {
    assert.throws(
      () => sectionPreviewAuthUrl(options.origin, "en", href, "code"),
      /invalid_preview_target/,
    );
  }
  assert.throws(
    () =>
      sectionPreviewAuthUrl(
        options.origin,
        "../settings",
        options.href,
        "code",
      ),
    /invalid_preview_handoff/,
  );
});
