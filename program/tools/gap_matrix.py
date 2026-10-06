"""The gap matrix skeleton: every spec item, who will own it, and what exists today.

    python tools/gap_matrix.py

Reads specs/spec-register.csv. Screens are mapped by hand (SCREENS below): the future owner
(ADM, USR, CMS, website), what exists today in the current apps (from audits/inventory/routes.csv
and the baseline sweeps), a status, and the plan's wave. Stories, flows and state tables inherit
owner and wave from the screens they touch; the pricing rules belong to the price resolver.
Open gaps (G-xx) become each row's decision dependency, by area.

Writes gap-analysis/gap-matrix.csv (the source of truth, per gap-analysis/README.md) and
gap-analysis/gap-analysis.md (the readout).

v0 maps by route name and spec text; statuses marked "(inferred)" in the evidence are confirmed or
corrected when that app's wave walks the screens.
"""
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

PROGRAM = Path(__file__).resolve().parent.parent
OUT = PROGRAM / "gap-analysis"
TODAY = "2026-09-30"

# The plan's stages (Phase E) and the Website Manager phase.
E1 = {f"ADM-{n:02d}" for n in [1, *range(3, 16), 29]} | {f"USR-{n:02d}" for n in [0, 2, 3, 4, 5, 6, 8]}
E2 = {f"USR-{n:02d}" for n in [7, *range(9, 16)]} | {f"ADM-{n:02d}" for n in [*range(16, 22), 23]}
E3 = {f"USR-{n:02d}" for n in range(16, 28)} | {f"ADM-{n:02d}" for n in [2, 22, 24, 25, 26, 28, 30, 31, 32, 33]}


def wave(screen):
    if screen in ("ADM-27", "ADM-28"):
        return "Phase 2 (Website Manager)"
    if screen == "USR-01":
        return "Phase 2 (display) · E1 (live prices)"
    return "E1" if screen in E1 else "E2" if screen in E2 else "E3" if screen in E3 else ""


# screen: (future owner, current app, current route, status, evidence / note)
SCREENS = {
    "ADM-01": ("ADM", "sos", "/auth/login", "Partial", "One login for everyone; no staff-only sign-in, no 2FA"),
    "ADM-02": ("ADM", "", "", "Missing", ""),
    "ADM-03": ("ADM", "sales", "/plan-management/categories", "Missing", "Sales' plan categories may hold tools (inferred)"),
    "ADM-04": ("ADM", "", "", "Missing", ""),
    "ADM-05": ("ADM", "sales", "/plan-management/features", "Partial", "Features exist; limits per plan to verify (inferred)"),
    "ADM-06": ("ADM", "sales", "/plan-management", "Partial", "Plans exist in Sales (inferred)"),
    "ADM-07": ("ADM", "sales", "/plan-management/:id", "Partial", "Plan editor exists in Sales (inferred)"),
    "ADM-08": ("ADM", "", "", "Missing", "No currency setup; zones carry a currency"),
    "ADM-09": ("ADM", "sales", "/plan-management/zones", "Conflicts", "Sales' zones (eg, gcc, eu, row) follow another model than spec 03"),
    "ADM-10": ("ADM", "sales", "/plan-management/zones", "Conflicts", "Same zone model conflict"),
    "ADM-11": ("ADM", "", "", "Missing", ""),
    "ADM-12": ("ADM", "sales", "/plan-management/:id", "Conflicts", "Prices per zone live in Sales' plan editor, in the conflicting model (inferred)"),
    "ADM-13": ("ADM", "", "", "Missing", ""),
    "ADM-14": ("ADM", "", "", "Missing", ""),
    "ADM-15": ("ADM", "", "", "Missing", ""),
    "ADM-16": ("ADM", "sales", "/packages", "Partial", "Sales' packages: tool bundles or service packages, to verify (inferred)"),
    "ADM-17": ("ADM", "sales", "/coupons", "Partial", "Coupons exist in Sales"),
    "ADM-18": ("ADM", "", "", "Missing", ""),
    "ADM-19": ("ADM", "", "", "Missing", ""),
    "ADM-20": ("ADM", "sales", "/subscriptions", "Conflicts", "Sales mixes CRM customers with SaaS subscriptions; the spec's workspace is the tenant (glossary: company vs workspace)"),
    "ADM-21": ("ADM", "sales", "/subscriptions/:id", "Conflicts", "Same concept conflict"),
    "ADM-22": ("ADM", "", "", "Missing", ""),
    "ADM-23": ("ADM", "sales", "/invoices", "Partial", "Invoices exist in Sales; payments, refunds and credit notes to verify"),
    "ADM-24": ("ADM", "", "", "Missing", ""),
    "ADM-25": ("ADM", "sales", "/offers", "Partial", "Sales' offers may be the quotes of service requests (inferred)"),
    "ADM-26": ("ADM", "sales", "/tickets", "Partial", "Tickets exist in Sales (and HR has internal ones: status matrix)"),
    "ADM-27": ("CMS", "content", "(the old site's content)", "Partial", "The old content dashboard manages the previous site; the Website Manager replaces it (D-019)"),
    "ADM-28": ("CMS", "", "", "Missing", "Delivered by the Website Manager (D-029); the website shows static roadmap ideas, with no moderation yet"),
    "ADM-29": ("ADM", "", "", "Missing", ""),
    "ADM-30": ("ADM", "sos", "/people · /people/:userId/scopes", "Partial", "Roles exist for customers' tools; no staff roles, no 2FA"),
    "ADM-31": ("ADM", "", "", "Missing", ""),
    "ADM-32": ("ADM", "", "", "Missing", ""),
    "ADM-33": ("ADM", "", "", "Missing", ""),
    "USR-00": ("USR", "sos + every tool", "SoSBar launcher", "Partial", "The launcher exists; no workspace switcher, tool states or banner slot (status matrix)"),
    "USR-01": ("Website + CMS", "website", "/software (plan builder)", "Partial", "Indicative CHF prices in the page code; no currency detection, not from the resolver"),
    "USR-02": ("USR", "website", "/sign-up", "Partial", "The website's sign-up is a preview with no backend (AGENTS.md)"),
    "USR-03": ("USR", "sos", "/auth/login", "Partial", "No 2FA; the website's sign-in is a preview"),
    "USR-04": ("USR", "", "", "Missing", ""),
    "USR-05": ("USR", "sos", "/", "Partial", "SOS home lists systems; not the spec's home (inferred)"),
    "USR-06": ("USR", "sos", "/systems", "Partial", "Lists the tools a user can open; no plans, states or seats (inferred)"),
    "USR-07": ("USR", "", "", "Missing", ""),
    "USR-08": ("USR", "", "", "Missing", ""),
    "USR-09": ("USR", "", "", "Missing", ""),
    "USR-10": ("USR", "", "", "Missing", ""),
    "USR-11": ("USR", "", "", "Missing", ""),
    "USR-12": ("USR", "", "", "Missing", ""),
    "USR-13": ("USR", "", "", "Missing", ""),
    "USR-14": ("USR", "", "", "Missing", ""),
    "USR-15": ("USR", "", "", "Missing", ""),
    "USR-16": ("USR", "", "", "Missing", ""),
    "USR-17": ("USR", "", "", "Missing", ""),
    "USR-18": ("USR", "", "", "Missing", ""),
    "USR-19": ("USR", "", "", "Missing", ""),
    "USR-20": ("USR", "sos", "/people", "Partial", "People and invites exist (sos /auth/invite)"),
    "USR-21": ("USR", "sos", "/people/:userId/scopes", "Partial", "Per-tool roles exist"),
    "USR-22": ("USR", "", "", "Missing", ""),
    "USR-23": ("USR", "sos", "/profile", "Partial", "Profile exists; no 2FA or sessions (inferred)"),
    "USR-24": ("USR", "each tool", "/notifications (tasks, hr, …)", "Partial", "Per-tool notifications; no suite-wide centre"),
    "USR-25": ("USR", "", "", "Missing", ""),
    "USR-26": ("USR", "", "", "Missing", "The website's roadmap has a suggestion form preview"),
    "USR-27": ("USR", "", "", "Missing", ""),
}

STATE_OWNER = {
    "ST-subscription-line-per-tool": "ADM + USR",
    "ST-service-request": "ADM + USR",
    "ST-invoice": "ADM + USR",
    "ST-support-ticket": "ADM + USR",
    "ST-workspace": "ADM + USR",
}

# Open gaps block the rows of their area. Area -> screens, from each gap group's subject.
AREA_SCREENS = {
    "Pricing & currency": {f"ADM-{n:02d}" for n in range(8, 18)} | {"USR-01", "USR-09"},
    "Billing, tax & payment": {"ADM-18", "ADM-19", "ADM-23"} | {f"USR-{n:02d}" for n in range(9, 16)},
    "Plans, limits & lifecycle": {f"ADM-{n:02d}" for n in range(3, 8)} | {"ADM-29", "USR-06", "USR-07", "USR-08"},
    "Admin & customer screens": set(),
    "Scope conflicts": {"USR-00", "USR-01", "ADM-03"},
}


def main():
    spec = list(csv.DictReader(open(PROGRAM / "specs" / "spec-register.csv", encoding="utf-8-sig")))
    by_id = {r["id"]: r for r in spec}
    gaps = [r for r in spec if r["kind"] == "gap"]
    open_gaps = [g for g in gaps if g["status"].lower().startswith("open")]

    def area_of_gap(g):
        return next((a for a in AREA_SCREENS if g["group"].startswith(a[:12])), "")

    blockers = defaultdict(list)  # screen -> open gap ids
    for g in open_gaps:
        for s in AREA_SCREENS.get(area_of_gap(g), set()):
            blockers[s].append(g["id"])
        for s in re.findall(r"(?:ADM|USR)-\d{2}", g["summary_en"]):
            blockers[s].append(g["id"])

    def screens_of(item):
        ids = re.findall(r"(?:ADM|USR)-\d{2}", f"{item['refs']} {item['referenced_by']}")
        return sorted(set(i for i in ids if i in SCREENS))

    rows = []
    n = 0

    def add(item, type_, owner, app, route, status, evidence, screens):
        nonlocal n
        n += 1
        deps = sorted(set(d for s in screens for d in blockers.get(s, [])))
        waves = sorted(set(wave(s) for s in screens if wave(s)))
        rows.append({
            "gap_id": f"GAP-{n:03d}",
            "spec_id": item["id"],
            "type": type_,
            "area": item["group"] or "",
            "requirement": item["title_en"],
            "priority": item["priority"],
            "future_owner": owner,
            "current_app": app,
            "current_route": route,
            "evidence": evidence,
            "status": status,
            "issues": "",
            "decision_dependency": " ".join(deps),
            "backlog_id": "",
            "size": "",
            "wave": " · ".join(waves),
            "last_verified": TODAY if app else "",
        })

    for item in spec:
        k = item["kind"]
        if k == "screen":
            owner, app, route, status, note = SCREENS[item["id"]]
            ev = f"routes.csv: {app} {route}" + (f" · {note}" if note else "") if app else note
            add(item, "screen", owner, app, route, status, ev, [item["id"]])
        elif k in ("story", "flow"):
            ss = screens_of(item)
            owners = sorted(set(SCREENS[s][0] for s in ss)) or (["ADM"] if item["id"].startswith("US-A") else ["USR"])
            statuses = [SCREENS[s][3] for s in ss]
            status = "Missing" if not statuses or "Missing" in statuses else "Conflicts" if "Conflicts" in statuses else "Partial"
            add(item, k, " + ".join(owners), "", "", status, f"Through {', '.join(ss)}" if ss else "No screen named in the spec", ss)
        elif k == "state_table":
            add(item, "state table", STATE_OWNER.get(item["id"], "ADM + USR"), "", "", "Partial", "Labels, tones, icons and next states are in status-matrix v0; the behaviour doesn't exist", [])
        elif k == "rule":
            add(item, "pricing rule", "Price resolver (ADM platform)", "", "", "Missing", "Spec 03; the E0 platform mock implements it first", [f"ADM-{m:02d}" for m in range(8, 18)])

    OUT.mkdir(exist_ok=True)
    cols = ["gap_id", "spec_id", "type", "area", "requirement", "priority", "future_owner", "current_app", "current_route", "evidence", "status", "issues", "decision_dependency", "backlog_id", "size", "wave", "last_verified"]
    with open(OUT / "gap-matrix.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    statuses = ["Exists-OK", "Exists-flawed", "Partial", "Conflicts", "Missing", "Superseded"]
    md = [
        "# Gap analysis v0: what we have vs what's correct",
        "",
        f"Generated by `tools/gap_matrix.py` on {TODAY} from the spec register (OrgTik_00–06 v1.0). The matrix is `gap-matrix.csv`. This is the **skeleton**: screens are mapped by route name and spec text. Rows whose evidence says *(inferred)* are confirmed or corrected when that app's wave walks the screens.",
        "",
        "## Coverage",
        "",
        "| Type | Items | " + " | ".join(statuses) + " |",
        "|---|---|" + "---|" * len(statuses),
    ]
    for t in ["screen", "story", "flow", "state table", "pricing rule"]:
        rs = [r for r in rows if r["type"] == t]
        c = Counter(r["status"] for r in rs)
        md.append(f"| {t} | {len(rs)} | " + " | ".join(str(c.get(s, 0)) for s in statuses) + " |")
    c = Counter(r["status"] for r in rows)
    md.append(f"| **all** | **{len(rows)}** | " + " | ".join(f"**{c.get(s, 0)}**" for s in statuses) + " |")
    md += ["", "No spec'd screen exists as specified yet: the SaaS core (ADM and USR) hasn't been built. What exists is partial coverage in SOS (identity, people, roles, the launcher) and in Sales (plans, zones, coupons, invoices, tickets), much of it in a model the spec replaces.", ""]

    md += ["## Screens by owner", "", "| Owner | Screens | Partial | Conflicts | Missing |", "|---|---|---|---|---|"]
    by_owner = defaultdict(list)
    for r in rows:
        if r["type"] == "screen":
            by_owner[r["future_owner"]].append(r)
    for o, rs in sorted(by_owner.items(), key=lambda x: -len(x[1])):
        cc = Counter(r["status"] for r in rs)
        md.append(f"| {o} | {len(rs)} | {cc.get('Partial', 0)} | {cc.get('Conflicts', 0)} | {cc.get('Missing', 0)} |")

    md += ["", "## What exists today, screen by screen", "", "| Spec | Screen | Owner | Today | Status | Evidence |", "|---|---|---|---|---|---|"]
    for r in rows:
        if r["type"] == "screen" and r["current_app"]:
            md.append(f"| {r['spec_id']} | {r['requirement']} | {r['future_owner']} | {r['current_app']} `{r['current_route']}` | {r['status']} | {r['evidence'].split(' · ', 1)[-1] if ' · ' in r['evidence'] else ''} |")

    md += ["", "## Conflicts register", "", "Where an existing app already does something the spec defines differently. Each needs a decision before its row can move.", ""]
    for r in rows:
        if r["type"] == "screen" and r["status"] == "Conflicts":
            md.append(f"- **{r['spec_id']} {r['requirement']}:** {r['evidence'].split(' · ', 1)[-1]}.")

    md += ["", "## Open decisions that block rows", "", "| Gap | Area | Question | Rows blocked |", "|---|---|---|---|"]
    for g in open_gaps:
        blocked = sum(1 for r in rows if g["id"] in r["decision_dependency"].split())
        md.append(f"| {g['id']} | {g['group']} | {g['title_en'][:110]} | {blocked} |")

    md += ["", "## Backlog by stage", "", "| Stage | Screens |", "|---|---|"]
    stage = defaultdict(list)
    for r in rows:
        if r["type"] == "screen":
            stage[r["wave"] or "(unassigned)"].append(r["spec_id"])
    for s in sorted(stage):
        md.append(f"| {s} | {', '.join(stage[s])} |")
    md += [
        "",
        "## Not in the matrix yet",
        "",
        "- **The reverse matrix** (routes no spec covers) is mostly the tools themselves: Tasks, Files, HR, Marketing and Chats aren't in the specs, which cover the SaaS core. Sales' CRM routes (commissions, loyalty, salesmen, demo, projects) are also outside the spec. Each tool's wave audits its own routes against the design system instead.",
        "- **Evidence per acceptance criterion** is added when a wave walks each screen.",
    ]
    (OUT / "gap-analysis.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"{len(rows)} rows -> gap-analysis/gap-matrix.csv, gap-analysis.md · " + ", ".join(f"{s} {c.get(s, 0)}" for s in statuses if c.get(s)))


if __name__ == "__main__":
    main()
