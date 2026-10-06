import { SERVICE_FAMILIES } from "./service-catalog.js";
import { SOFTWARE_PRODUCTS } from "./software-catalog.js";

export const MONTHS = [1, 3, 6, 12];
export const HOSTING_URL = "https://orgtik.ch";
export const CRM_PORTAL_URL = import.meta.env?.VITE_CRM_PORTAL_URL || "";
export const TERM_SAVINGS = { 1: 0, 3: 5, 6: 10, 12: 15 };
const servicePrices = {
  "design/graphic-design": 900,
  "design/brand-development": 1200,
  "design/web-and-app-design": 1800,
  "development/web-development": 2400,
  "development/custom-app-development": 3200,
  "marketing/social-media-marketing": 900,
  "marketing/digital-advertising-switzerland": 1100,
  "marketing/seo-services": 1000,
  "it-support/website-management": 350,
  "it-support/software-support": 600,
};
const softwarePrices = {
  hr: 49,
  crm: 59,
  files: 19,
  tasks: 29,
  marketing: 39,
  website: 29,
};
const serviceNames = {
  "design/graphic-design": "Graphic design",
  "design/brand-development": "Branding",
  "design/web-and-app-design": "Web & app design",
  "development/web-development": "Web development",
  "development/custom-app-development": "Custom app development",
  "marketing/social-media-marketing": "Social media",
  "marketing/digital-advertising-switzerland": "Advertising management",
  "marketing/seo-services": "SEO",
  "it-support/website-management": "Website management",
  "it-support/software-support": "Software support",
};
export const CATALOG = [
  ...SERVICE_FAMILIES.filter((f) => f.slug !== "hosting")
    .flatMap((f) =>
      f.children.map((c) => ({
        id: `${f.slug}/${c.slug}`,
        kind: "service",
        department: f.slug,
        departmentName: f.short,
        name: serviceNames[`${f.slug}/${c.slug}`] || c.name,
        description: c.summary,
        capabilities: c.capabilities,
        icon: f.icon,
      })),
    )
    .map((item) => ({ ...item, monthlyMinor: servicePrices[item.id] * 100 })),
  ...SOFTWARE_PRODUCTS.map((p) => ({
    id: p.id,
    kind: "software",
    department: p.category.toLowerCase(),
    departmentName: p.category,
    name: p.formal,
    description: p.short,
    capabilities: p.tasks,
    icon: p.icon,
    monthlyMinor: softwarePrices[p.id] * 100,
  })),
];
const bundle = (id, kind, department, name, ids, why, recommended = false) => ({
  id,
  kind,
  department,
  name,
  ids,
  why,
  recommended,
});
export const BUNDLES = [
  bundle(
    "brand-presence",
    "service",
    "design",
    "Brand Presence",
    ["design/graphic-design", "design/brand-development"],
    "Connect your identity with the materials people see every day.",
    true,
  ),
  bundle(
    "digital-experience",
    "service",
    "design",
    "Digital Experience",
    ["design/graphic-design", "design/web-and-app-design"],
    "Bring your visual communications and digital interfaces together.",
  ),
  bundle(
    "complete-design",
    "service",
    "design",
    "Complete Design",
    [
      "design/graphic-design",
      "design/brand-development",
      "design/web-and-app-design",
    ],
    "One connected selection for identity, communication, and digital experiences.",
  ),
  bundle(
    "product-build",
    "service",
    "development",
    "Product Build",
    ["development/web-development", "development/custom-app-development"],
    "Coordinate website and application development in one roadmap.",
    true,
  ),
  bundle(
    "search-social",
    "service",
    "marketing",
    "Search & Social",
    ["marketing/seo-services", "marketing/social-media-marketing"],
    "Connect search visibility with a consistent social presence.",
    true,
  ),
  bundle(
    "campaign-growth",
    "service",
    "marketing",
    "Campaign Growth",
    [
      "marketing/social-media-marketing",
      "marketing/digital-advertising-switzerland",
    ],
    "Plan social content and paid campaigns together. Media spend is separate.",
  ),
  bundle(
    "complete-marketing",
    "service",
    "marketing",
    "Complete Marketing",
    [
      "marketing/seo-services",
      "marketing/social-media-marketing",
      "marketing/digital-advertising-switzerland",
    ],
    "Connect search, social, and paid campaign management. Media spend is separate.",
  ),
  bundle(
    "digital-care",
    "service",
    "it-support",
    "Digital Care",
    ["it-support/website-management", "it-support/software-support"],
    "Keep your website and existing software supported together.",
    true,
  ),
  bundle(
    "team-workspace",
    "software",
    "operations",
    "Team Workspace",
    ["hr", "tasks", "files"],
    "Bring your people, projects, and documents into one workspace.",
    true,
  ),
  bundle(
    "sales-marketing",
    "software",
    "growth",
    "Sales & Marketing",
    ["crm", "marketing", "website"],
    "Connect customer relationships, campaigns, and website work.",
  ),
  bundle(
    "business-suite",
    "software",
    "all",
    "Business Suite",
    ["hr", "crm", "files", "tasks", "marketing", "website"],
    "All six products for a connected business workspace.",
  ),
];
export const findItem = (id, kind) =>
  CATALOG.find((x) => x.id === id && (!kind || x.kind === kind));
export const findBundle = (id) => BUNDLES.find((x) => x.id === id);
export const money = (minor) =>
  "CHF " +
  new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: minor % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
export const termLabel = (months) =>
  months ? `${months} month${months === 1 ? "" : "s"}` : "Choose duration";
export const countSaving = (count) =>
  count >= 5 ? 15 : count >= 3 ? 10 : count >= 2 ? 5 : 0;
let sequence = 0;
const newId = () =>
  globalThis.crypto?.randomUUID?.() || `group-${Date.now()}-${++sequence}`;
export function createGroup(input = {}) {
  input = input && typeof input === "object" ? input : {};
  const kind = input.kind === "software" ? "software" : "service";
  const defaultMonths = MONTHS.includes(Number(input.defaultMonths))
    ? Number(input.defaultMonths)
    : 1;
  const ids = new Set();
  const lines = (Array.isArray(input.lines) ? input.lines : [])
    .filter((line) => {
      if (!line || !findItem(line.catalogId, kind) || ids.has(line.catalogId))
        return false;
      ids.add(line.catalogId);
      return true;
    })
    .slice(0, 30)
    .map((line) => ({
      catalogId: line.catalogId,
      months: MONTHS.includes(Number(line.months)) ? Number(line.months) : null,
      autoRenew: line.autoRenew === true,
    }));
  const template = findBundle(input.bundleId);
  return {
    id: typeof input.id === "string" ? input.id.slice(0, 120) : newId(),
    kind,
    bundleId: template?.kind === kind ? template.id : null,
    defaultMonths,
    lines,
    needsReview: input.needsReview === true,
  };
}
export function groupFromIds(kind, ids, months = 1, bundleId = null) {
  return createGroup({
    kind,
    bundleId,
    defaultMonths: months,
    lines: ids.map((catalogId) => ({ catalogId, months, autoRenew: false })),
  });
}
export function groupName(group) {
  const template = findBundle(group.bundleId);
  const exact =
    template &&
    template.ids.length === group.lines.length &&
    template.ids.every((id) => group.lines.some((l) => l.catalogId === id));
  if (exact) return template.name;
  if (template) return `${template.name} · customized`;
  if (group.lines.length === 1)
    return findItem(group.lines[0].catalogId, group.kind)?.name || "Package";
  return group.kind === "software"
    ? "Custom software plan"
    : "Custom service plan";
}
export const groupTerm = (group) =>
  new Set(group.lines.map((l) => l.months)).size > 1
    ? "Mixed durations"
    : termLabel(group.lines[0]?.months);
export function quoteGroup(group) {
  const normalized = createGroup(group);
  const bundleRate = countSaving(normalized.lines.length);
  const lines = normalized.lines.map((line) => {
    const item = findItem(line.catalogId, normalized.kind);
    const termRate = TERM_SAVINGS[line.months] || 0;
    const discount = Math.max(termRate, bundleRate);
    const subtotal = line.months ? item.monthlyMinor * line.months : 0;
    const total = Math.round((subtotal * (100 - discount)) / 100);
    return {
      ...line,
      name: item.name,
      kind: item.kind,
      monthlyMinor: item.monthlyMinor,
      subtotal,
      total,
      saving: subtotal - total,
      discount,
      reason: termRate >= bundleRate ? "duration" : "bundle",
      monthlyEquivalent: line.months ? total / line.months : 0,
    };
  });
  const sum = (key) => lines.reduce((n, l) => n + l[key], 0);
  return {
    lines,
    subtotal: sum("subtotal"),
    total: sum("total"),
    saving: sum("saving"),
    monthlyEquivalent: sum("monthlyEquivalent"),
    valid:
      lines.length > 0 &&
      lines.every((l) => MONTHS.includes(l.months)) &&
      !normalized.needsReview,
  };
}
export function quoteCart(groups) {
  const quotes = groups.map(quoteGroup);
  const ids = quotes.flatMap((q) => q.lines.map((l) => l.catalogId));
  const sum = (key) => quotes.reduce((n, q) => n + q[key], 0);
  return {
    subtotal: sum("subtotal"),
    saving: sum("saving"),
    total: sum("total"),
    monthlyEquivalent: sum("monthlyEquivalent"),
    valid:
      groups.length > 0 &&
      quotes.every((q) => q.valid) &&
      new Set(ids).size === ids.length,
  };
}
export function groupFingerprint(group) {
  return JSON.stringify([
    group.kind,
    group.lines
      .map((l) => [l.catalogId, l.months, l.autoRenew])
      .sort((a, b) => a[0].localeCompare(b[0])),
  ]);
}
export function configurationHref(group) {
  const params = new URLSearchParams({
    [group.kind === "software" ? "modules" : "services"]: group.lines
      .map((l) => l.catalogId)
      .join(","),
    duration: String(group.defaultMonths),
  });
  if (group.bundleId) params.set("bundle", group.bundleId);
  params.set(
    "terms",
    group.lines.map((l) => `${l.catalogId}:${l.months || ""}`).join(","),
  );
  if (group.lines.some((l) => l.autoRenew))
    params.set(
      "renew",
      group.lines
        .filter((l) => l.autoRenew)
        .map((l) => l.catalogId)
        .join(","),
    );
  return `/${group.kind === "software" ? "software" : "services"}?${params}#${group.kind === "software" ? "plan-builder" : "svc-builder"}`;
}
export function groupFromLocation(kind, location) {
  const params = new URLSearchParams(location.search);
  let ids = (
    params.get(kind === "software" ? "modules" : "services") ||
    (kind === "software" ? params.get("module") : "") ||
    ""
  )
    .split(",")
    .filter((id) => findItem(id, kind));
  if (!ids.length && kind === "software") {
    const presets = {
      operations: ["hr", "tasks", "files"],
      growth: ["crm", "marketing", "website"],
      complete: ["hr", "crm", "files", "tasks", "marketing", "website"],
      suite: ["hr", "crm", "files", "tasks", "marketing", "website"],
    };
    ids = presets[params.get("mode")] || [];
  }
  if (
    !ids.length &&
    kind === "software" &&
    location.hash.startsWith("#/plans/")
  )
    ids = location.hash
      .split("/")
      .at(-1)
      .split(",")
      .filter((id) => findItem(id, kind));
  const template = findBundle(params.get("bundle"));
  if (!ids.length && template?.kind === kind) ids = template.ids;
  const raw =
    params.get("duration") ||
    (kind === "software" && location.hash.startsWith("#/plans/")
      ? location.hash.split("/")[3]
      : null);
  const months =
    raw === null
      ? 1
      : raw === "annual"
        ? 12
        : raw === "monthly"
          ? 1
          : Number(raw);
  const group = groupFromIds(
    kind,
    ids,
    MONTHS.includes(months) ? months : 1,
    template?.id,
  );
  const terms = new Map(
    (params.get("terms") || "").split(",").map((part) => {
      const pos = part.lastIndexOf(":");
      return [part.slice(0, pos), Number(part.slice(pos + 1))];
    }),
  );
  const renew = new Set((params.get("renew") || "").split(","));
  group.lines = group.lines.map((line) => ({
    ...line,
    months: terms.has(line.catalogId)
      ? MONTHS.includes(terms.get(line.catalogId))
        ? terms.get(line.catalogId)
        : null
      : MONTHS.includes(months)
        ? months
        : null,
    autoRenew: renew.has(line.catalogId),
  }));
  return group;
}
export function migrateLegacy(items) {
  const messages = new Set();
  const seen = new Set();
  const groups = [];
  for (const old of Array.isArray(items) ? items : []) {
    if (!old || !["service", "software"].includes(old.kind)) continue;
    const months =
      old.termId === "biennial"
        ? 24
        : old.termId === "annual"
          ? 12
          : old.termId === "monthly"
            ? 1
            : Number(old.commitmentMonths);
    const ids = (old.selections || [])
      .flatMap((s) => {
        const family = SERVICE_FAMILIES.find((f) => f.slug === s.id);
        return family
          ? family.children.map((c) => `${family.slug}/${c.slug}`)
          : [s.id];
      })
      .filter((id) => {
        if (String(id).startsWith("hosting")) {
          messages.add(
            "Hosting is purchased on the external OrgTik website and was removed from this cart.",
          );
          return false;
        }
        if (!findItem(id, old.kind)) {
          messages.add(
            "An unavailable item was removed. Review your saved selection.",
          );
          return false;
        }
        if (seen.has(`${old.kind}:${id}`)) {
          messages.add(
            "Overlapping saved selections were combined. Review their durations.",
          );
          return false;
        }
        seen.add(`${old.kind}:${id}`);
        return true;
      });
    if (!ids.length) continue;
    const group = groupFromIds(
      old.kind,
      ids,
      MONTHS.includes(months) ? months : 1,
    );
    group.needsReview = true;
    if (!MONTHS.includes(months) || old.billing === "project")
      group.lines.forEach((line) => {
        line.months = null;
      });
    groups.push(group);
  }
  if (groups.length)
    messages.add(
      "Packages and prices have changed. Review each saved group and confirm its scope before checkout.",
    );
  return { groups, messages: [...messages] };
}
