// Tasks: the wave's golden flows (audits/tasks/wave-plan.md, T1–T8), walked in the browser. Names
// and messages come from Tasks' catalog and the library's strings, so the same walk runs in every
// language.
//
//   node flows/tasks.mjs [--locale ar] [--only T3]   (Tasks, the SOS mock API and the Tasks mock running)
//
// Takes the shared flow lock before it resets the mock (lib/mock.mjs), so it never runs at the same
// time as another session's flows. Writes audits/tasks/flows[/<locale>]/<flow>/NN-<step>.png and
// walks.json.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, PASSWORD, WORKSPACE, redact, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const APP = path.join(WORKSPACE, "task-manager-front-main");
const CATALOG = JSON.parse(fs.readFileSync(path.join(APP, "messages", `${LOCALE}.json`), "utf8"));
const { STRINGS } = await import("file:///" + path.join(APP, "node_modules", "@orgtik", "ui", "dist", "i18n", "strings.js").replace(/\\/g, "/"));
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
// The app's own message; ICU plurals give their "other" form with # as the count.
const m = (key, values = {}) => {
  const raw = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof raw !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  const plural = /\{\w+, plural,.*other \{([^}]*)\}\}/.exec(raw);
  return fill(plural ? plural[1].replace(/#/g, String(values.count ?? "")) : raw, values).replace(/[⁨⁩]/g, "");
};
const SOS_CATALOG = JSON.parse(fs.readFileSync(path.join(WORKSPACE, "somion-sos-frontend-main", "messages", `${LOCALE}.json`), "utf8"));
const sos = (key) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), SOS_CATALOG);
const L = (key, values = {}) => fill(String(STRINGS[LOCALE]?.[key] ?? STRINGS.en[key]), values);

const OUT = path.join(AUDITS, "tasks", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const TASKS = webUrl("tasks");
const API = `${apiUrl("tasks")}/api`;
const KARIM = "karim.hassan@orgtik.test";
const SALMA = "salma.nabil@orgtik.test";
const OMAR = "omar.farouk@orgtik.test";
const MONA = "mona.adel@orgtik.test";
const PROJECT = 2;
const stamp = Date.now().toString(36).slice(-4);

const call = async (email, method, url, body) => {
  const token = await tokenFor(email);
  const r = await fetch(API + url, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
};
const board = () => call(KARIM, "GET", `/projects/${PROJECT}/board`).then((j) => j.data);

const browser = await chromium.launch();
const walks = [];
const unlock = await mock.lock("tasks-flows (Tasks wave session)");

async function walk(id, title, as, fn) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  if (as) await signIn(ctx, "tasks", as);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  let n = 0;
  const step = async (name, action, check) => {
    n++;
    const started = Date.now();
    let ok = true;
    let note = "";
    try {
      await action();
      await page.waitForTimeout(500);
      if (check) {
        const r = await check();
        ok = r === true || (typeof r === "object" && r !== null && r.ok !== false);
        note = typeof r === "object" && r ? r.note || "" : r === true ? "" : String(r);
      }
    } catch (e) {
      ok = false;
      note = String(e.message).split("\n")[0];
    }
    const shot = `${String(n).padStart(2, "0")}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}.png`;
    await page.screenshot({ path: path.join(dir, shot) }).catch(() => {});
    steps.push({ n, name, ok, note, ms: Date.now() - started, url: redact(page.url()), screenshot: `${id}/${shot}` });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${n}. ${name}${note ? ` (${note})` : ""}`);
    return ok;
  };
  console.log(`\n${id}: ${title}`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, locale: LOCALE, as, steps, console: log.console.slice(0, 10), uncaught: log.page.slice(0, 5), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(`${TASKS}/${LOCALE}${route === "/" ? "" : route}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page);
};
const toastText = (page) => page.locator("[data-orgtik-toast]").allInnerTexts().then((t) => t.join(" | ")).catch(() => "");
const columnOf = async (taskId) => {
  const b = await board();
  const t = b.tasks.find((x) => x.id === taskId);
  return t ? b.columns.find((c) => c.id === t.columnId) : null;
};

try {
  // T1: the suite hands Tasks a one-time code; nothing secret stays in any address.
  await walk("T1-open-from-suite", "Open Tasks from the suite", null, async ({ page, step }) => {
    const seen = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
    await step("Arrive with a one-time code", async () => {
      const token = await tokenFor(MONA);
      const code = (await (await fetch(`${apiUrl("sos")}/api/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).json()).data.code;
      await page.goto(`${TASKS}/${LOCALE}/auth?code=${code}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => !u.pathname.endsWith("/auth"), { timeout: 60000 });
      await settle(page);
    }, async () => {
      const leaked = seen.filter((u) => /[?&](token|code)=/.test(u) && !/\/auth\?code=/.test(u));
      const h1 = await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => "");
      return { ok: !leaked.length && !page.url().includes("code=") && h1 === m("Dashboard.title"), note: `landed on ${new URL(page.url()).pathname} ("${h1}")` };
    });
    await step("Back doesn't reopen the hand-off", () => page.goBack().catch(() => {}), async () => !/code=/.test(page.url()) || `back went to ${redact(page.url())}`);
  });

  // T2: a project manager adds a task to a column; it lands in that column.
  await walk("T2-add-to-column", "Add a task to a column", KARIM, async ({ page, step }) => {
    const b = await board();
    const col = b.columns.find((c) => c.flag === "in_review") ?? b.columns[1];
    const title = `Flow task ${stamp}`;
    await step("Open the board", () => open(page, `/projects/${PROJECT}/board`), async () => (await page.getByRole("button", { name: new RegExp(`^${L("boardOpen", { title: "" })}`) }).count()) > 0 || "no cards");
    await step(`Add task to a column`, async () => {
      await page.getByRole("button", { name: new RegExp(m("BoardPage.addTo", { section: ".*" })) }).nth(b.columns.indexOf(col)).click();
      const dialog = page.getByRole("dialog", { name: m("TaskForm.createTitle") });
      await dialog.getByRole("textbox", { name: m("TaskForm.name") }).fill(title);
      await dialog.getByRole("button", { name: m("TaskForm.create") }).click();
      await dialog.waitFor({ state: "hidden", timeout: 15000 });
      await page.waitForTimeout(1200);
    }, async () => {
      const after = await board();
      const created = after.tasks.find((x) => x.title === title);
      return { ok: Boolean(created) && created.columnId === col.id, note: created ? `in column ${created.columnId} (expected ${col.id})` : "not created" };
    });
    await step("The card shows in that column", () => page.waitForTimeout(500), async () => (await page.getByRole("button", { name: L("boardOpen", { title }) }).isVisible()) || "card not visible");
  });

  // T3: a developer moves a card with the keyboard; then a refused move puts it back.
  await walk("T3-move", "Move a task with the keyboard; a refused move puts it back", SALMA, async ({ page, step }) => {
    const b = await board();
    const from = b.columns[1];
    const task = b.tasks.find((x) => x.columnId === from.id);
    await step("Open the board", () => open(page, `/projects/${PROJECT}/board`), async () => (await page.getByRole("button", { name: L("boardMove", { title: task.title }), exact: true }).count()) === 1 || "no handle for the card");
    await step("Lift, move to the next column, drop (keyboard)", async () => {
      await page.getByRole("button", { name: L("boardMove", { title: task.title }), exact: true }).focus();
      await page.keyboard.press("Space");
      await page.waitForTimeout(300);
      await page.keyboard.press(LOCALE === "ar" ? "ArrowLeft" : "ArrowRight");
      await page.waitForTimeout(300);
      await page.keyboard.press("Space");
      await page.waitForTimeout(1500);
    }, async () => {
      const c = await columnOf(task.id);
      return { ok: c?.id === b.columns[2].id, note: `now in ${c?.title} (expected ${b.columns[2].title})` };
    });
    await step("Reload: still there", () => open(page, `/projects/${PROJECT}/board`), async () => (await columnOf(task.id))?.id === b.columns[2].id || "moved back after reload");
    await step("The API refuses the next move: the card goes back and a toast says so", async () => {
      await mock.addFault({ app: "tasks", method: "POST", match: "/move", status: 500, times: 1 });
      await page.getByRole("button", { name: L("boardMoveTo", { title: task.title }), exact: true }).click();
      await page.getByRole("menuitem", { name: L("boardToBottom") }).click();
      await page.waitForTimeout(1500);
    }, async () => {
      const said = await toastText(page);
      const c = await columnOf(task.id);
      return { ok: c?.id === b.columns[2].id && said.includes(m("BoardPage.moveFailed")), note: `server column ${c?.title}; toast "${said.slice(0, 80)}"` };
    });
    await mock.clearFaults();
  });

  // T4: open a task from a link, comment, delete it; the board stays usable.
  await walk("T4-task-sheet", "Work inside a task, then delete it", KARIM, async ({ page, step }) => {
    const b = await board();
    const task = b.tasks[0];
    await step("Open the task from its link", () => open(page, `/projects/${PROJECT}/board?task-id=${task.id}`), async () => (await page.getByRole("dialog").getByRole("heading", { name: task.title }).isVisible()) || "sheet not open");
    await step("Comment", async () => {
      const box = page.getByRole("dialog").getByRole("textbox").last();
      await box.fill(`Checked ${stamp}`);
      await page.keyboard.press("Control+Enter");
      await page.waitForTimeout(1500);
    }, async () => (await page.getByRole("dialog").getByText(`Checked ${stamp}`).count()) > 0 || "comment not shown");
    await step("Delete the task (confirmed)", async () => {
      await page.getByRole("dialog").getByRole("button", { name: m("TaskSheet.delete") }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: m("TaskSheet.deleteConfirm") }).click();
      await page.waitForTimeout(2000);
    }, async () => {
      const gone = !(await board()).tasks.some((x) => x.id === task.id);
      return { ok: gone && !page.url().includes("task-id="), note: gone ? "deleted, sheet closed" : "still there" };
    });
    await step("The board is still usable", () => page.getByRole("button", { name: L("boardOpen", { title: b.tasks[1].title }) }).click(), async () => (await page.getByRole("heading", { name: b.tasks[1].title }).first().isVisible()) || "next card didn't open");
  });

  // T5: start a project; the list shows it and the toast opens it.
  await walk("T5-start-project", "Start a project", KARIM, async ({ page, step }) => {
    const name = `Flow project ${stamp}`;
    await step("Projects", () => open(page, "/projects"), async () => (await page.getByRole("heading", { level: 1, name: m("ProjectList.title") }).isVisible()) || "no heading");
    await step("Create project", async () => {
      await page.getByRole("button", { name: m("ProjectList.create") }).first().click();
      const dialog = page.getByRole("dialog", { name: m("ProjectForm.createTitle") });
      await dialog.getByRole("textbox", { name: m("ProjectForm.name") }).fill(name);
      await dialog.getByRole("button", { name: m("ProjectForm.create") }).click();
      await dialog.waitFor({ state: "hidden", timeout: 15000 });
      await page.waitForTimeout(800);
    }, async () => (await page.getByRole("main").getByRole("link", { name, exact: true }).first().isVisible()) || "not in the list");
    await step("Open it from the toast", async () => {
      await page.locator("[data-orgtik-toast]").getByRole("button", { name: m("ProjectForm.open") }).click();
      await page.waitForURL(/\/projects\/\d+\/board/, { timeout: 15000 });
      await settle(page);
    }, async () => (await page.getByRole("heading", { level: 1, name }).isVisible()) || "board heading missing");
  });

  // T6: a project manager opens a team and its tabs (they were sent back to SOS before).
  await walk("T6-open-team", "Open a team", KARIM, async ({ page, step }) => {
    let teamName = "";
    await step("Teams", () => open(page, "/teams"), async () => {
      teamName = (await page.getByRole("table").getByRole("link").first().innerText()).trim();
      return Boolean(teamName) || "no team link";
    });
    await step("Open the team by its name", async () => {
      await page.getByRole("link", { name: teamName }).first().click();
      await page.waitForURL(/\/teams\/\d+\/overview/, { timeout: 15000 });
      await settle(page);
    }, async () => (await page.getByRole("heading", { level: 1, name: teamName }).isVisible()) || "no team heading");
    for (const tab of ["priority", "feed", "team"]) {
      await step(`Tab: ${tab}`, async () => {
        await page.getByRole("navigation", { name: m("TeamPage.sections") }).getByRole("link", { name: m(`TeamPage.tabs.${tab}`) }).click();
        await page.waitForURL(new RegExp(`/${tab}$`), { timeout: 15000 });
        await settle(page);
      }, async () => (await page.getByRole("link", { name: m(`TeamPage.tabs.${tab}`) }).getAttribute("aria-current")) === "page" || "tab not current");
    }
    await step("Back to Teams by the breadcrumb", async () => {
      await page.getByRole("navigation", { name: L("breadcrumb") }).getByRole("link", { name: m("TeamPage.teams") }).click();
      await page.waitForURL(/\/teams$/, { timeout: 15000 });
    }, async () => (await page.getByRole("heading", { level: 1, name: m("TeamList.title") }).isVisible()) || "not on Teams");
  });

  // T7: a viewer reads the board but is offered no change; My tasks says why it's closed.
  await walk("T7-read-only", "A viewer reads, and isn't offered changes", OMAR, async ({ page, step }) => {
    await step("Board", () => open(page, `/projects/${PROJECT}/board`), async () => {
      const open_ = await page.getByRole("button", { name: new RegExp(`^${L("boardOpen", { title: "" })}`) }).count();
      const handles = await page.getByRole("button", { name: new RegExp(`^${L("boardMove", { title: "" })}`) }).count();
      const adds = await page.getByRole("button", { name: new RegExp(m("BoardPage.addTo", { section: ".*" })) }).count();
      return { ok: open_ > 0 && handles === 0 && adds === 0, note: `${open_} cards, ${handles} handles, ${adds} add buttons` };
    });
    await step("My tasks", () => open(page, "/my-tasks/overview"), async () => (await page.getByRole("heading", { level: 1, name: m("Errors.noAccessTitle") }).isVisible()) || "no no-permission state");
  });

  // T8: the calendar is a grid the keyboard moves through; Arabic weeks start on Saturday.
  await walk("T8-calendar", "Plan in the calendar", SALMA, async ({ page, step }) => {
    await step("My tasks › Calendar", () => open(page, "/my-tasks/calendar"), async () => (await page.getByRole("grid").count()) === 1 || "no grid");
    await step("Next month with the keyboard", async () => {
      await page.getByRole("grid").getByRole("gridcell").locator("[tabindex='0']").first().focus().catch(async () => page.getByRole("grid").locator("[tabindex='0']").first().focus());
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(800);
    }, async () => /date=\d{4}-\d{2}-\d{2}/.test(page.url()) || `month not in the address (${redact(page.url())})`);
    await step("Week starts where the language starts it", () => page.waitForTimeout(100), async () => {
      const first = (await page.getByRole("columnheader").first().innerText()).trim();
      const expected = LOCALE === "ar" ? "السبت" : null;
      return expected ? first.includes(expected) || `first day "${first}"` : { ok: true, note: `first day "${first}"` };
    });
  });

  // T9: signed out, a link deep into Tasks: sign in through the suite and land on that page (TASKS-021).
  await walk("T9-deep-link-after-sign-in", "Sign in again and land on the page you opened", null, async ({ page, ctx, step }) => {
    const target = `/${LOCALE}/projects/${PROJECT}/lists`;
    await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: webUrl("sos") }]);
    await step("Open a Tasks link while signed out", async () => {
      await page.goto(TASKS + target, { waitUntil: "load", timeout: 120000 });
      await page.waitForURL((u) => u.href.startsWith(webUrl("sos")) && /login/.test(u.pathname), { timeout: 60000 });
      await settle(page);
    }, async () => /\/auth\/login/.test(page.url()) || `not on the sign-in page (${redact(page.url())})`);
    await step("Sign in", async () => {
      await page.getByRole("textbox", { name: sos("Auth.email") }).fill(MONA);
      await page.getByRole("textbox", { name: sos("Auth.password"), exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: sos("Auth.submit") }).click();
      await page.waitForURL((u) => u.href.startsWith(TASKS) && !/\/auth/.test(u.pathname), { timeout: 90000 });
      await settle(page);
    }, async () => ({ ok: new URL(page.url()).pathname === target && !/[?&](code|token)=/.test(page.url()), note: `landed on ${new URL(page.url()).pathname}` }));
  });
} finally {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
  const all = walks.flatMap((w) => w.steps);
  console.log(`\n${all.filter((s) => s.ok).length}/${all.length} steps ok (${LOCALE})`);
  await mock.reset().catch(() => {});
  unlock();
  await browser.close();
}
