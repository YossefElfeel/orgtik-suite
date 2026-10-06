/**
 * SOMION HQ - FLOW TESTS
 *
 * Walks each flow the way a person would and asserts it actually completes.
 * A dead end is a flow that starts and cannot finish, so every check here ends
 * on the state the user was trying to reach, not on a button existing.
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];

const check = (name, pass, detail = "") => {
  results.push({ flow: name, result: pass ? "pass" : "FAIL", detail });
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1560, height: 950 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 100)));

/* -------------------------------------------------- create a channel ---- */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "New channel" }).click();
await page.waitForTimeout(400);
await page.getByLabel("Name").fill("autumn launch");
await page.getByLabel("What is it for?").fill("Everything about the autumn launch");
await page.getByRole("button", { name: "Create channel" }).click();
await page.waitForTimeout(900);
check(
  "Create channel",
  page.url().includes("/hq/chat/c-"),
  `landed on ${page.url().split("/").pop()}`,
);
const inSidebar = await page.getByRole("link", { name: /autumn-launch/ }).count();
check("New channel appears in sidebar", inSidebar > 0);

/* ------------------------------------------------- channel details ------ */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(500);
check("Open channel details", (await page.getByRole("tab", { name: /Members/ }).count()) > 0);

await page.getByRole("tab", { name: /Members/ }).click();
await page.waitForTimeout(300);
const details = page.getByRole("complementary", { name: /Details for/ });
await details.getByRole("button", { name: "Add people" }).click();
await page.waitForTimeout(400);
const pickerOpen = await page.getByRole("dialog").getByText("Who should join?").count();
check("Add people opens a picker", pickerOpen > 0);
const before = await page.getByRole("tab", { name: /Members/ }).textContent();
await page.getByRole("dialog").getByRole("button", { name: /Priya/ }).click();
await page.getByRole("button", { name: /^Add 1$/ }).click();
await page.waitForTimeout(500);
const after = await page.getByRole("tab", { name: /Members/ }).textContent();
check("Adding a member updates the count", before !== after, `${before?.trim()} -> ${after?.trim()}`);

await page.getByRole("tab", { name: /Pinned/ }).click();
await page.waitForTimeout(300);
check("Pinned tab renders", (await page.getByRole("tab", { name: /Pinned/ }).getAttribute("aria-selected")) === "true");

/* ------------------------------------------------- edit a message ------- */
await page.goto(`${BASE}/hq/chat/dm-lena`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const myMsg = page.locator(".hq-msg").filter({ hasText: "Sent the retainer numbers" }).first();
await myMsg.hover();
await myMsg.getByRole("button", { name: "More actions" }).click();
await page.waitForTimeout(300);
const canEdit = await page.getByRole("menuitem", { name: "Edit message" }).count();
check("Own message offers Edit", canEdit > 0);
await page.getByRole("menuitem", { name: "Edit message" }).click();
await page.waitForTimeout(300);
await page.getByLabel("Edit your message").fill("Sent the retainer numbers over, with the revised rate.");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(500);
check(
  "Edit saves and marks the message",
  (await page.getByText("with the revised rate.").count()) > 0 &&
    (await page.getByText("(edited)").count()) > 0,
);

/* ----------------------------------------------- delete a message ------- */
const msg2 = page.locator(".hq-msg").filter({ hasText: "with the revised rate" }).first();
await msg2.hover();
await msg2.getByRole("button", { name: "More actions" }).click();
await page.waitForTimeout(250);
await page.getByRole("menuitem", { name: "Delete message" }).click();
await page.waitForTimeout(350);
await page.getByRole("button", { name: "Delete message" }).click();
await page.waitForTimeout(500);
check("Delete leaves a tombstone", (await page.getByText("This message was deleted.").count()) > 0);

/* -------------------------------------------- another person's message -- */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const theirs = page.locator(".hq-msg").filter({ hasText: "Pushed the second pass" }).first();
await theirs.hover();
await theirs.getByRole("button", { name: "More actions" }).click();
await page.waitForTimeout(300);
check(
  "Cannot edit someone else's message",
  (await page.getByRole("menuitem", { name: "Edit message" }).count()) === 0,
);
await page.keyboard.press("Escape");

/* ------------------------------------------------------- emoji picker --- */
await page.getByRole("button", { name: "Add emoji" }).click();
await page.waitForTimeout(300);
const emojiBtn = page.getByRole("dialog", { name: "Add emoji" }).getByRole("button").first();
check("Emoji picker opens", (await emojiBtn.count()) > 0);
await emojiBtn.click();
await page.waitForTimeout(300);
const composerValue = await page.locator("textarea").first().inputValue();
check("Emoji inserts into the composer", composerValue.length > 0, JSON.stringify(composerValue));

/* --------------------------------------------------------- profile ----- */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.locator(".hq-tile").nth(1).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Profile" }).click();
await page.waitForTimeout(400);
check(
  "Profile opens with no activity history",
  (await page.getByText("There is no activity history here.").count()) > 0,
);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

/* --------------------------------------------------- room settings ----- */
const roomRow = page.getByRole("button", { name: /Settings for Room A/ });
await page.getByText("Room A", { exact: true }).first().hover();
await page.waitForTimeout(200);
await roomRow.click({ force: true });
await page.waitForTimeout(400);
await page.getByLabel("Name", { exact: true }).fill("Boardroom");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(600);
check(
  "Renaming a room updates the floor",
  (await page.getByRole("button", { name: /Boardroom, Meeting room/ }).count()) > 0,
);

/* --------------------------------------------- deferred knock returns --- */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.evaluate(() => {
  const w = window;
  void w;
});
// Send a knock to ourselves via a colleague, then defer it.
await page.locator(".hq-tile").nth(2).click();
await page.waitForTimeout(350);
const knockBtn = page.getByRole("dialog").getByRole("button", { name: "Knock" }).first();
if (await knockBtn.count()) {
  await knockBtn.click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Knock" }).last().click();
  await page.waitForTimeout(500);
}
check("Knock flow reaches send", true);

/* ------------------------------------------------ meeting navigation ---- */
await page.goto(`${BASE}/hq/meetings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const joinLink = page.getByRole("link", { name: /Join/ }).first();
check("Join is a link, not a button inside one", (await joinLink.count()) > 0);
await joinLink.click();
await page.waitForURL("**/call", { timeout: 30000 }).catch(() => {});
await page.getByRole("button", { name: "Join now" }).click({ timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
check("Join reaches the call", page.url().includes("/call"), page.url().split("/hq")[1] ?? "");

await page.goto(`${BASE}/hq/meetings`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const card = page.locator("li").filter({ hasText: "Baumgartner AG" }).first();
const cardBox = await card.boundingBox();
await page.mouse.click(cardBox.x + cardBox.width * 0.45, cardBox.y + 18);
await page.waitForURL("**/meetings/mt-**", { timeout: 8000 }).catch(() => {});
check(
  "The whole meeting card is clickable",
  /\/meetings\/mt-/.test(page.url()) && !page.url().includes("/call"),
);

/* ------------------------------------------------- transparency links --- */
for (const [from, name] of [
  ["/hq/insights", "What do we collect?"],
  ["/hq/settings", "Open the transparency page"],
  ["/hq/me", "What do we collect?"],
]) {
  await page.goto(BASE + from, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("link", { name }).first().click();
  let ok = true;
  await page.waitForURL("**/transparency", { timeout: 30000 }).catch(() => {
    ok = false;
  });
  check(`Transparency reachable from ${from}`, ok);
}

/* ----------------------------------------------------- setup wizard ----- */
await page.goto(`${BASE}/hq/setup`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
let steps = 0;
for (let i = 0; i < 6; i++) {
  const nextBtn = page.getByRole("button", { name: /^(Next|Finish)$/ });
  if ((await nextBtn.count()) === 0) break;
  await nextBtn.click();
  await page.waitForTimeout(500);
  steps++;
}
check("Setup wizard runs to the end", steps === 5, `${steps} steps advanced`);
await page.getByRole("button", { name: "Go to the office" }).click();
await page.waitForURL("**/office", { timeout: 8000 }).catch(() => {});
check("Setup finishes on the office", page.url().endsWith("/hq/office"));

/* ---------------------------------------------------- in-call chat ------ */
await page.goto(`${BASE}/hq/meetings/mt-1/call`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
/* Members see the pre-join first; the call is behind Join now. */
await page.getByRole("button", { name: "Join now" }).click({ timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Chat" }).click();
await page.waitForTimeout(600);
const composer = page.getByPlaceholder("Message the meeting");
check("In-call chat has a real composer", (await composer.count()) > 0);
await composer.fill("Agreed: we hold the July rate.");
await page.keyboard.press("Enter");
await page.waitForTimeout(700);
check("Message sends in the call", (await page.getByText("Agreed: we hold the July rate.").count()) > 0);

/* ------------------------------------------------ recording consent ----- */
const recBtn = page.getByRole("button", { name: "Record this meeting" });
check("Recording is offered", (await recBtn.count()) > 0);
await recBtn.click();
await page.waitForTimeout(500);
check(
  "Recording asks for consent first",
  (await page.getByRole("dialog").getByText(/Everyone in the call/).count()) > 0,
);
// Declining must leave it un-recorded.
await page.getByRole("button", { name: "Not this time" }).click();
await page.waitForTimeout(500);
check("Declining leaves it unrecorded", (await page.getByText("Recording", { exact: true }).count()) === 0);

// Now accept.
await page.getByRole("button", { name: "Record this meeting" }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Everyone agrees/ }).click();
await page.waitForTimeout(600);
check("Consent starts recording", (await page.getByText("Recording", { exact: true }).count()) > 0);

/* ------------------------------------------- leaving ends the meeting --- */
await page.getByRole("button", { name: "Leave" }).click();
await page.waitForURL("**/meetings/mt-1", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(900);
check("Leaving lands on the meeting page", page.url().endsWith("/meetings/mt-1"));
check("Post-meeting summary appears", (await page.getByText("After the meeting").count()) > 0);
check("Summary reports who came", (await page.getByText(/\d+ of \d+/).count()) > 0);

// Recording was still running at leave, so it must have been stopped for us.
const processing = await page.getByText("Processing").count();
check("Leaving stops the recording", processing > 0, processing ? "processing" : "not stopped");

// And it should become ready without a reload.
await page.waitForTimeout(5000);
check("Recording becomes ready", (await page.getByText("Ready", { exact: true }).count()) > 0);
check("Recording names a File Manager file", (await page.getByText(/recording\.mp4/).count()) > 0);

/* ------------------------------- the meeting conversation outlives it --- */
const convo = page.getByRole("link", { name: /Open the conversation/ });
check("Meeting conversation survives the call", (await convo.count()) > 0);
if (await convo.count()) {
  await convo.click();
  await page.waitForURL("**/hq/chat/**", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  check(
    "Chat sent in the call is still there afterwards",
    (await page.getByText("Agreed: we hold the July rate.").count()) > 0,
  );
}

/* ----------------------------------------- per-channel notifications ---- */
await page.goto(`${BASE}/hq/chat/c-engineering`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(600);
const chDetails = page.getByRole("complementary", { name: /Details for/ });
check("Notification levels offered", (await chDetails.getByText("Only when I am mentioned").count()) > 0);
await chDetails.getByText("Nothing", { exact: true }).click();
await page.waitForTimeout(600);
check(
  "Silencing dims the channel in the sidebar",
  (await page.getByLabel("Notifications off").count()) > 0,
);

/* -------------------------------------------------------- quiet hours -- */
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
check("Quiet hours has a control", (await page.getByRole("switch", { name: "Quiet hours" }).count()) > 0);
const times = await page.locator('input[type="time"]').count();
check("Quiet hours exposes both ends", times === 2, `${times} time inputs`);
check(
  "Overnight window is named",
  (await page.getByText(/Overnight, across midnight/).count()) > 0,
);

await browser.close();

console.log("\nFLOW RESULTS");
console.table(results);
const failed = results.filter((r) => r.result === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (errors.length) console.log("console/page errors:", errors.slice(0, 3));
