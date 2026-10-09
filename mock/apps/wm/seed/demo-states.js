// Repeatable examples. Published content is retained; existing user revisions always win.
const clone = (value) => JSON.parse(JSON.stringify(value));
const TYPES = [
  "page",
  "global",
  "strings",
  "serviceFamily",
  "service",
  "softwareModule",
  "caseStudy",
  "article",
  "roadmapItem",
  "review",
];
function contentExamples({ entries, audit, ideas, now }) {
  const at = now();
  for (const type of TYPES) {
    const rows = [...entries.values()].filter((entry) => entry.type === type);
    const candidates = rows.filter(
      (entry) =>
        (entry.workflow.version === 1 && !entry.draft) ||
        (entry.workflow.lastEditor === "assistant" &&
          entry.workflow.version === 2),
    );
    const reserved = rows.find((entry) => !entry.draft);
    for (const state of ["draft", "in_review", "approved", "scheduled"]) {
      if (rows.some((entry) => entry.draft && entry.workflow.state === state))
        continue;
      const entry = candidates.find(
        (entry) => entry !== reserved && !entry.demoState,
      );
      if (!entry) continue;
      entry.draft = clone(entry.draft ?? entry.live);
      entry.demoState = true;
      entry.workflow = {
        ...entry.workflow,
        state,
        version: entry.workflow.version + 1,
        lastEditor: "admin",
        updatedBy: state === "draft" ? "admin" : "manager",
        updatedAt: at,
        ...(state === "scheduled"
          ? {
              publishAt: new Date(
                Date.parse(at) + 365 * 86400000,
              ).toISOString(),
            }
          : {}),
      };
      entry.versions.unshift({
        version: entry.workflow.version,
        state,
        at,
        by: entry.workflow.updatedBy,
        note: `Sample ${state.replaceAll("_", " ")} revision; existing published content is unchanged.`,
        content: clone(entry.draft),
      });
      audit.unshift({
        at,
        by: entry.workflow.updatedBy,
        action: "sample_revision",
        entry: entry.id,
        type,
        version: entry.workflow.version,
        targetName:
          entry.live?.name ?? entry.live?.locales.en?.name ?? entry.id,
        sample: true,
      });
    }
  }
  // Translation examples only touch untouched seed translations.
  const translations = ["needs_review", "outdated", "in_progress"];
  [...entries.values()]
    .filter((entry) => entry.demoState)
    .slice(0, 12)
    .forEach((entry, index) => {
      const locale = ["ar", "de", "fr", "it"][index % 4];
      entry.translation[locale] = translations[index % 3];
    });
  const base = [...ideas.values()][0];
  if (base)
    for (const [index, status] of ["declined", "hidden", "merged"].entries()) {
      const id = `idea_demo_${status}`;
      if (ideas.has(id)) continue;
      const row = {
        ...clone(base),
        id,
        title: `Sample ${status} idea`,
        body: "This is a sample moderation record for reviewing closed outcomes.",
        status,
        sample: true,
        votes: 0,
        version: 1,
        createdAt: at,
        history: [
          {
            at,
            by: "manager",
            action:
              status === "declined"
                ? "decline"
                : status === "hidden"
                  ? "hide"
                  : "merge",
            from: "pending",
            to: status,
            reason: "Sample moderation outcome",
          },
        ],
        ...(status === "merged"
          ? { mergedInto: base.id }
          : { reason: "Sample moderation outcome" }),
      };
      ideas.set(id, row);
      audit.unshift({
        at,
        by: "manager",
        action: `idea_${row.history[0].action}`,
        entry: id,
        type: "idea",
        sample: true,
        targetName: row.title,
      });
    }
}
function leadExamples(leads, now) {
  const base = [...leads.values()][0];
  if (!base) return;
  for (const status of [
    "contacted",
    "qualified",
    "quoted",
    "won",
    "unqualified",
    "lost",
    "spam",
    "duplicate",
  ]) {
    const id = `ld_demo_${status}`;
    if (leads.has(id)) continue;
    const at = now();
    const stages = ["new", "contacted", "qualified", "quoted", "won"];
    const passed = stages.includes(status)
      ? stages.slice(0, stages.indexOf(status) + 1)
      : ["new", status];
    leads.set(id, {
      ...clone(base),
      id,
      status,
      name: `Sample ${status} lead`,
      email: `${status}@example.test`,
      sample: true,
      version: 1,
      ...(status === "duplicate" ? { duplicateOf: base.id } : {}),
      reason: "Sample lifecycle outcome",
      history: passed
        .map((to, index) => ({
          at,
          by: index ? "manager" : "visitor",
          action: index
            ? ({
                contacted: "contact",
                qualified: "qualify",
                quoted: "quote",
                won: "win",
                lost: "lose",
                unqualified: "unqualify",
              }[to] ?? to)
            : "submitted",
          from: passed[index - 1],
          to,
        }))
        .reverse(),
    });
  }
}
function redirectExamples(redirects, now) {
  for (const [source, code, suffix] of [
    ["manager", 302, "campaign"],
    ["address_change", 301, "renamed"],
    ["archived", 301, "retired"],
  ]) {
    const id = `rd_demo_${source}`;
    if (!redirects.has(id))
      redirects.set(id, {
        id,
        from: `/sample-${suffix}`,
        to: "/services",
        code,
        source,
        handledBy: "host",
        note: "Sample redirect for demonstrating this kind and origin.",
        createdBy: "manager",
        createdAt: now(),
        version: 1,
        sample: true,
      });
  }
}
module.exports = { contentExamples, leadExamples, redirectExamples };
