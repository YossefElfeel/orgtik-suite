"""How the suite names its core concepts today, in every language it has.

    python tools/term_usage.py

Sources, per app:
    catalogs    messages/*.json (next-intl): the English string and its de/fr/it/ar siblings
    t-default   Chats' inline t("key", "Default text") strings (English only)
    jsx         literal text and label/title/placeholder props in .tsx/.jsx, for the apps with no
                catalogs (SOS, Marketing) and for the website (English only)

Only short strings count (1-4 words: labels, headings, buttons, column titles). They're where
a concept gets its name; sentences mostly repeat it.

Writes:
    glossary/term-usage.csv   one row per string that names a concept
    glossary/term-usage.md    per concept: the English forms in use per app, and the distinct
                              translations each language uses for the bare term, with counts

This is the "what we have" side of the glossary. glossary/glossary.csv is the "what's correct" side.
"""
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

PROGRAM = Path(__file__).resolve().parent.parent
WORKSPACE = PROGRAM.parent
OUT = PROGRAM / "glossary"

APPS = {
    "sos": "somion-sos-frontend-main",
    "tasks": "task-manager-front-main",
    "files": "file-manager-dashboard-main",
    "sales": "sales-dashboardv2-main",
    "hr": "somion-hr-dashboard-main",
    "marketing": "digital-marketing-frontend-main",
    "content": "content-dashboard-somion-main",
    "chats": "somion-hq",
    "website": "orgtik-website/landing-directions",
}
LANGS = ["de", "fr", "it", "ar"]
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "public", "messages", "mock", "local-dev"}

# (group, concept key, the English word as a regex: singular and plural forms)
CONCEPTS = [
    ("commercial", "plan", r"plans?"),
    ("commercial", "tier", r"tiers?"),
    ("commercial", "package", r"packages?"),
    ("commercial", "bundle", r"bundles?"),
    ("commercial", "subscription", r"subscriptions?"),
    ("commercial", "seat", r"seats?"),
    ("commercial", "workspace", r"workspaces?"),
    ("commercial", "tool", r"tools?"),
    ("commercial", "module", r"modules?"),
    ("commercial", "app", r"apps?|applications?"),
    ("commercial", "trial", r"trials?|free trial"),
    ("commercial", "beta", r"beta"),
    ("commercial", "invoice", r"invoices?"),
    ("commercial", "coupon", r"coupons?|promo codes?|discount codes?"),
    ("commercial", "discount", r"discounts?"),
    ("commercial", "zone", r"zones?"),
    ("commercial", "currency", r"currency|currencies"),
    ("commercial", "price", r"prices?|pricing"),
    ("commercial", "billing", r"billing"),
    ("commercial", "payment", r"payments?"),
    ("commercial", "refund", r"refunds?"),
    ("commercial", "quote", r"quotes?|quotations?"),
    ("people", "user", r"users?"),
    ("people", "member", r"members?"),
    ("people", "employee", r"employees?"),
    ("people", "owner", r"owners?"),
    ("people", "admin", r"admins?|administrators?"),
    ("people", "role", r"roles?"),
    ("people", "permission", r"permissions?"),
    ("people", "team", r"teams?"),
    ("people", "department", r"departments?"),
    ("people", "customer", r"customers?"),
    ("people", "client", r"clients?"),
    ("people", "lead", r"leads?"),
    ("people", "contact", r"contacts?"),
    ("people", "company", r"company|companies|organi[sz]ations?"),
    ("work", "dashboard", r"dashboards?"),
    ("work", "project", r"projects?"),
    ("work", "task", r"tasks?"),
    ("work", "board", r"boards?"),
    ("work", "folder", r"folders?"),
    ("work", "file", r"files?"),
    ("work", "ticket", r"tickets?"),
    ("work", "deal", r"deals?"),
    ("work", "campaign", r"campaigns?"),
    ("work", "post", r"posts?"),
    ("work", "leave", r"leaves?|leave requests?|time off|vacations?"),
    ("work", "payroll", r"payroll|payslips?"),
    ("work", "attendance", r"attendance"),
    ("work", "report", r"reports?"),
    ("work", "analytics", r"analytics"),
    ("work", "notification", r"notifications?"),
    ("work", "settings", r"settings"),
    ("action", "delete", r"delete"),
    ("action", "remove", r"remove"),
    ("action", "archive", r"archive"),
    ("action", "restore", r"restore"),
    ("action", "cancel", r"cancel"),
    ("action", "save", r"save|save changes"),
    ("action", "submit", r"submit"),
    ("action", "share", r"share"),
    ("action", "invite", r"invite"),
    ("action", "upgrade", r"upgrade"),
    ("action", "edit", r"edit"),
    ("action", "create", r"create|add new|new"),
    ("action", "export", r"export"),
    ("action", "filter", r"filters?"),
    ("action", "search", r"search"),
    ("status", "active", r"active"),
    ("status", "inactive", r"inactive"),
    ("status", "pending", r"pending"),
    ("status", "approved", r"approved"),
    ("status", "rejected", r"rejected"),
    ("status", "draft", r"drafts?"),
    ("status", "published", r"published"),
    ("status", "scheduled", r"scheduled"),
    ("status", "completed", r"completed|done"),
    ("status", "cancelled", r"cancell?ed"),
    ("status", "expired", r"expired"),
    ("status", "overdue", r"overdue|past due"),
    ("status", "paid", r"paid"),
    ("status", "unpaid", r"unpaid"),
    ("status", "in_progress", r"in progress"),
    ("status", "on_hold", r"on hold"),
    ("status", "open", r"open"),
    ("status", "closed", r"closed"),
    ("status", "archived", r"archived"),
]
PARTIAL = {k: re.compile(rf"\b(?:{p})\b", re.I) for _, k, p in CONCEPTS}
BARE = {k: re.compile(rf"^(?:{p})[:.]?$", re.I) for _, k, p in CONCEPTS}
GROUP = {k: g for g, k, _ in CONCEPTS}


def words(s):
    return len(re.sub(r"\{[^}]*\}", "", s).split())


def flatten(obj, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from flatten(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(obj, str):
        yield prefix, obj


def catalogs(app_dir):
    msgs = app_dir / "messages"
    out = {}
    for lang in ["en", *LANGS]:
        f = msgs / f"{lang}.json"
        if f.exists():
            out[lang] = dict(flatten(json.loads(f.read_text(encoding="utf-8"))))
    return out


def source_files(app_dir):
    for f in app_dir.rglob("*"):
        if f.suffix in {".tsx", ".jsx", ".ts"} and not (set(f.relative_to(app_dir).parts) & SKIP_DIRS):
            yield f


T_DEFAULT = re.compile(r"""\bt\(\s*(["'`])([^"'`]+)\1\s*,\s*(["'`])((?:(?!\3).){1,80})\3""")
JSX_TEXT = re.compile(r">\s*([A-Za-z][^<>{}\n]{0,60}?)\s*<")
JSX_PROP = re.compile(r"""\b(?:label|title|placeholder|aria-label|alt)\s*=\s*"([A-Za-z][^"\n]{0,60})\"""")


def strings_for(app, app_dir):
    """Yields (source, key, en, {lang: translation})."""
    cats = catalogs(app_dir)
    en = cats.get("en", {})
    if en:
        for key, text in en.items():
            yield "catalog", key, text, {l: cats.get(l, {}).get(key, "") for l in LANGS}
    if app == "chats":
        for f in source_files(app_dir):
            for m in T_DEFAULT.finditer(f.read_text(encoding="utf-8", errors="ignore")):
                yield "t-default", m.group(2), m.group(4), {}
    if not en and app != "chats":
        for f in source_files(app_dir):
            text = f.read_text(encoding="utf-8", errors="ignore")
            rel = f.relative_to(app_dir).as_posix()
            for rx in (JSX_TEXT, JSX_PROP):
                for m in rx.finditer(text):
                    line = text.count("\n", 0, m.start()) + 1
                    yield "jsx", f"{rel}:{line}", m.group(1).strip(), {}


def main():
    rows = []
    for app, rel in APPS.items():
        app_dir = WORKSPACE / rel
        if not app_dir.exists():
            continue
        for source, key, en, tr in strings_for(app, app_dir):
            en = en.strip()
            if not en or words(en) > 4:
                continue
            for concept, rx in PARTIAL.items():
                if rx.search(en):
                    rows.append({"group": GROUP[concept], "concept": concept, "app": app, "source": source, "key": key, "en": en, "bare": "yes" if BARE[concept].match(en) else "", **{l: tr.get(l, "") for l in LANGS}})

    OUT.mkdir(exist_ok=True)
    cols = ["group", "concept", "app", "source", "key", "en", "bare", *LANGS]
    with open(OUT / "term-usage.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    by = defaultdict(list)
    for r in rows:
        by[r["concept"]].append(r)

    def top(counter, n=4):
        return " · ".join(f"{t} ({c})" for t, c in counter.most_common(n)) or "–"

    md = [
        "# Term usage: what the suite calls things today",
        "",
        "Generated by `tools/term_usage.py` from every app's message catalogs, Chats' inline strings, and the literal copy in SOS, Marketing and the website. Only short strings count (1–4 words).",
        "",
        "- **English forms** are the bare labels (the term on its own) per app. The website and the apps without catalogs are English only.",
        "- **de / fr / it / ar** are the translations the catalogs give for those bare labels, with how often each appears. Two or more terms in one cell is an inconsistency to settle in `glossary.csv`.",
        "- **strings** counts every short string that contains the term.",
        "",
    ]
    for group in ["commercial", "people", "work", "action", "status"]:
        md.append(f"## {group.capitalize()}")
        md.append("")
        md.append("| Concept | Strings | English forms (apps) | de | fr | it | ar |")
        md.append("|---|---|---|---|---|---|---|")
        for _, concept, _ in [c for c in CONCEPTS if c[0] == group]:
            rs = by.get(concept, [])
            if not rs:
                md.append(f"| {concept} | 0 | – | – | – | – | – |")
                continue
            bare = [r for r in rs if r["bare"]]
            forms = defaultdict(set)
            for r in bare:
                forms[r["en"].rstrip(":.")].add(r["app"])
            form_cell = " · ".join(f"{f} ({', '.join(sorted(a))})" for f, a in sorted(forms.items(), key=lambda x: -len(x[1]))[:4]) or "–"
            cells = []
            for l in LANGS:
                c = Counter(r[l].strip().rstrip(":.") for r in bare if r[l].strip())
                cells.append(top(c))
            md.append(f"| {concept} | {len(rs)} | {form_cell} | " + " | ".join(cells) + " |")
        md.append("")
    (OUT / "term-usage.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"{len(rows)} strings across {len(by)} concepts -> glossary/term-usage.csv, term-usage.md")


if __name__ == "__main__":
    main()
