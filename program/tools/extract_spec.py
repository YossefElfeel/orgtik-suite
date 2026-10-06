"""Extract the OrgTik spec files (OrgTik_00-06 .docx) into CSV registers.

    python tools/extract_spec.py [path/to/specs]      (default: the folder above this repo)

Writes to specs/:
    spec-register.csv     one row per traceable item: screens (ADM/USR), stories (US-C/US-A),
                          flows (F), gaps (G), state tables (ST), pricing rules (R03)
    screen-fields.csv     every field of every screen (type, required, rules, EN and AR)
    flow-steps.csv        every step of every flow (actor, screen)
    states.csv            the state tables in 06, plus the tool states and banners in USR-00
    permission-matrix.csv staff role x module (file 02)
    terms.csv             the pricing terms in 03 (a seed for the glossary)

It uses only the standard library: pandoc and python-docx aren't installed here.
CSVs are UTF-8 with a BOM, so Excel shows the Arabic correctly.
"""

import csv
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "specs")

ID_RE = re.compile(r"\b(ADM-\d{2}|USR-\d{2}|US-[CA]-\d{2}|F-\d{2}|G-\d{2})\b")


# ---------------------------------------------------------------- docx reading

def para_text(p):
    return "".join(t.text or "" for t in p.iter(W + "t")).strip()


def cell_lines(tc):
    """A table cell as its non-empty paragraphs."""
    return [t for t in (para_text(p) for p in tc.iter(W + "p")) if t]


def cell_text(tc):
    return "\n".join(cell_lines(tc))


def blocks(path):
    """Yield ('p', style, text) and ('tbl', rows) in document order. rows = [[cell, ...], ...]."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    for b in root.find(W + "body"):
        if b.tag == W + "p":
            st = b.find(f"{W}pPr/{W}pStyle")
            yield ("p", st.get(W + "val") if st is not None else "", para_text(b))
        elif b.tag == W + "tbl":
            yield ("tbl", [[c for c in tr.findall(W + "tc")] for tr in b.findall(W + "tr")])


def split_bilingual(title):
    """'ADM-01  Staff login  |  دخول الموظفين' -> ('ADM-01  Staff login', 'دخول الموظفين')."""
    parts = [p.strip() for p in title.split("|")]
    return (parts[0], parts[1] if len(parts) > 1 else "")


def version_of(path):
    for kind, *rest in blocks(path):
        if kind == "p" and rest[1].startswith("Version"):
            return rest[1]
    return ""


def expand_refs(text):
    """'US-C-01, 02, 03' -> US-C-01, US-C-02, US-C-03; 'US-A-13 → 19' -> US-A-13 … US-A-19.

    A bare two-digit number takes the prefix of the last full ID before it; an arrow
    between two numbers expands to the whole range."""
    out = []
    prefix = None
    last = None
    in_range = False
    for m in re.finditer(r"(US-[CA]-|ADM-|USR-|F-|G-)(\d{2})|(→|->)|\b(\d{2})\b", text):
        if m.group(3):
            in_range = True
            continue
        if m.group(1):
            new_prefix, n = m.group(1), int(m.group(2))
            if new_prefix != prefix:
                in_range = False
            prefix = new_prefix
        elif m.group(4) and prefix:
            n = int(m.group(4))
        else:
            continue
        if in_range and last is not None and n > last:
            out.extend(f"{prefix}{i:02d}" for i in range(last + 1, n + 1))
        else:
            out.append(f"{prefix}{n:02d}")
        last, in_range = n, False
    return list(dict.fromkeys(out))


# ---------------------------------------------------------------- registers

register = []
fields = []
steps = []
states = []
permissions = []
terms = []


def add(**row):
    base = {k: "" for k in REGISTER_COLS}
    base.update({k: v for k, v in row.items() if v is not None})
    register.append(base)


REGISTER_COLS = [
    "id", "kind", "doc", "group", "title_en", "title_ar", "priority", "status", "refs", "referenced_by",
    "summary_en", "summary_ar", "ac_count", "field_count", "step_count", "state_count", "doc_version",
]


def short(text, n=400):
    text = re.sub(r"\s+", " ", text or "").strip()
    return text if len(text) <= n else text[: n - 1] + "…"


# ---- 00: gaps
def parse_00(path, ver):
    area = ""
    for kind, *rest in blocks(path):
        if kind != "tbl":
            continue
        rows = rest[0]
        if not rows or cell_text(rows[0][0]) != "ID":
            continue
        for r in rows[1:]:
            if len(r) == 1:
                area = split_bilingual(cell_text(r[0]))[0]
                continue
            gid, _area, gap_en, gap_ar, dec_en, dec_ar, status = (cell_text(c) for c in r[:7])
            add(id=gid, kind="gap", doc="00", group=area, title_en=short(gap_en, 160), title_ar=short(gap_ar, 160),
                status=status, refs=", ".join(sorted(set(ID_RE.findall(dec_en + " " + gap_en)) - {gid})),
                summary_en=short(f"Gap: {gap_en} Decision: {dec_en}"), summary_ar=short(f"الفجوة: {gap_ar} القرار: {dec_ar}"),
                doc_version=ver)


# ---- 01, 02: stories (+ 02 permission matrix)
def parse_stories(path, doc, ver):
    epic = ""
    for kind, *rest in blocks(path):
        if kind != "tbl":
            continue
        rows = rest[0]
        if not rows:
            continue
        head = [cell_text(c) for c in rows[0]]
        if head[:2] == ["ID", "User story"]:
            for r in rows[1:]:
                if len(r) == 1:
                    epic = split_bilingual(cell_text(r[0]))[0]
                    continue
                sid, story_en, story_ar = (cell_text(c) for c in r[:3])
                ac_en_lines = cell_lines(r[3])
                ac_ar = cell_text(r[4])
                prio = cell_text(r[5])
                add(id=sid, kind="story", doc=doc, group=epic, title_en=short(story_en, 200), title_ar=short(story_ar, 200),
                    priority=prio, refs=", ".join(sorted(set(ID_RE.findall(" ".join(ac_en_lines))) - {sid})),
                    summary_en=short(" | ".join(ac_en_lines)), summary_ar=short(ac_ar), ac_count=str(len(ac_en_lines)),
                    doc_version=ver)
        elif head[:2] == ["Module", "القسم"]:
            roles = head[2:]
            for r in rows[1:]:
                vals = [cell_text(c) for c in r]
                permissions.append({"module_en": vals[0], "module_ar": vals[1], **{roles[i]: vals[2 + i] for i in range(len(roles))}})


# ---- 03: pricing rules and terms
def parse_03(path, ver):
    section = ""
    for kind, *rest in blocks(path):
        if kind == "p":
            style, text = rest
            if style == "Heading1":
                section = split_bilingual(text)[0]
            continue
        rows = rest[0]
        if not rows:
            continue
        head = [cell_text(c) for c in rows[0]]
        if head[:2] == ["Term", "المصطلح"]:
            for r in rows[1:]:
                t_en, t_ar, d_en, d_ar = (cell_text(c) for c in r[:4])
                terms.append({"term_en": t_en, "term_ar": t_ar, "definition_en": d_en, "definition_ar": d_ar, "source": "03 · Terms"})
        elif head[0] in ("#", "Step") and len(head) >= 3:
            prefix = "ALG" if head[0] == "Step" else None
            for i, r in enumerate(rows[1:], 1):
                vals = [cell_text(c) for c in r]
                code = vals[0]
                if head[0] == "#" and head[1] == "Case":  # worked example: #, case, result, why, السبب
                    add(id=f"R03-EX-{code}", kind="rule", doc="03", group=section, title_en=short(vals[1], 160),
                        summary_en=short(f"{vals[1]} → {vals[2]}. {vals[3]}"), summary_ar=short(vals[4] if len(vals) > 4 else ""), doc_version=ver)
                    continue
                rid = f"R03-{prefix}-{code}" if prefix else f"R03-{code}"
                add(id=rid, kind="rule", doc="03", group=section, title_en=short(vals[1], 160), title_ar=short(vals[2], 160),
                    summary_en=short(vals[1]), summary_ar=short(vals[2]), doc_version=ver)
        elif head[:2] == ["Country / region", "Tax"]:
            for r in rows[1:]:
                vals = [cell_text(c) for c in r]
                add(id=f"R03-TAX-{re.sub(r'[^A-Za-z]+', '-', vals[0]).strip('-')}", kind="rule", doc="03", group=section,
                    title_en=f"{vals[0]}: {vals[1]}", summary_en=short(vals[2]), summary_ar=short(vals[3]), doc_version=ver)
        elif head[:2] == ["Market", "Currency"]:
            for r in rows[1:]:
                vals = [cell_text(c) for c in r]
                add(id=f"R03-PAY-{re.sub(r'[^A-Za-z]+', '-', vals[0]).strip('-')}", kind="rule", doc="03", group=section,
                    title_en=f"{vals[0]} ({vals[1]}): {vals[2]}", summary_en=short(f"Methods: {vals[3]}. {vals[4]}"), doc_version=ver)


# ---- 04, 05: screens
def parse_screens(path, doc, ver):
    groups = {}  # screen id -> sidebar group / sitemap area
    cur = None
    for kind, *rest in blocks(path):
        if kind == "p":
            style, text = rest
            m = re.match(r"^(ADM-\d{2}|USR-\d{2})\s+(.*)$", text)
            if style == "Heading2" and m:
                en, ar = split_bilingual(m.group(2))
                cur = {"id": m.group(1), "title_en": en, "title_ar": ar, "attrs": {}, "attrs_ar": {}, "fields": 0, "extra": []}
                register_screen(cur, doc, ver, groups, pending=True)
            elif style == "Heading1":
                cur = None
            continue
        rows = rest[0]
        if not rows:
            continue
        head = [cell_text(c) for c in rows[0]]
        if cur is None:
            # Navigation (04) or Sitemap (05): map screens to their group
            if head[:2] in (["Sidebar group", "المجموعة"], ["Area", "المنطقة"]):
                for r in rows[1:]:
                    vals = [cell_text(c) for c in r]
                    for sid in ID_RE.findall(vals[2]):
                        groups[sid] = vals[0]
            continue
        if head[:2] == ["Field", "الحقل"]:
            for r in rows[1:]:
                vals = [cell_text(c) for c in r] + [""] * 6
                fields.append({"screen_id": cur["id"], "field_en": vals[0], "field_ar": vals[1], "type": vals[2],
                               "required": vals[3], "rules_en": vals[4], "rules_ar": vals[5]})
                cur["fields"] += 1
        elif len(head) == 4 and head[0] in ("Tool state", "Banner"):
            entity = f"{head[0]} ({cur['id']})"
            for r in rows[1:]:
                vals = [cell_text(c) for c in r]
                states.append({"entity": entity, "state_en": vals[0], "state_ar": vals[1], "meaning_en": vals[2],
                               "meaning_ar": vals[3], "next_states": "", "source": f"{doc} · {cur['id']}"})
            cur["extra"].append(f"{head[0]} table ({len(rows) - 1})")
        elif len(head) == 4:
            # key/value rows: [label EN, value EN, value AR, label AR]
            for r in rows:
                vals = [cell_text(c) for c in r]
                if len(vals) == 4:
                    cur["attrs"][vals[0]] = vals[1]
                    cur["attrs_ar"][vals[0]] = vals[2]
        else:
            cur["extra"].append(f"table {head[:3]}")
    # finalise: fill in the screen rows now that all tables are read
    for row in register:
        s = row.pop("_screen", None)
        if s is None:
            continue
        a = s["attrs"]
        refs = expand_refs(a.get("Stories", ""))
        row.update(
            group=groups.get(s["id"], "(not in the navigation)"),
            refs=", ".join(refs),
            summary_en=short(" · ".join(f"{k}: {v}" for k, v in a.items() if k != "Stories")),
            summary_ar=short(" · ".join(v for k, v in s["attrs_ar"].items() if k != "Stories")),
            field_count=str(s["fields"]),
            state_count=str(sum(1 for st in states if st["source"].endswith(s["id"]))) if s["extra"] else "",
        )


def register_screen(cur, doc, ver, groups, pending):
    add(id=cur["id"], kind="screen", doc=doc, title_en=cur["title_en"], title_ar=cur["title_ar"], doc_version=ver)
    register[-1]["_screen"] = cur


# ---- 06: flows and state tables
def parse_06(path, ver):
    cur = None
    in_states = False
    for kind, *rest in blocks(path):
        if kind == "p":
            style, text = rest
            if style == "Heading1":
                in_states = "State" in text
                cur = None
            elif style == "Heading2":
                en, ar = split_bilingual(text)
                if in_states:
                    slug = re.sub(r"[^a-z]+", "-", en.lower()).strip("-")
                    cur = {"id": f"ST-{slug}", "title_en": en, "title_ar": ar, "kind": "state_table"}
                else:
                    m = re.match(r"^(F-\d{2})\s+(.*)$", en)
                    cur = {"id": m.group(1) if m else en, "title_en": m.group(2) if m else en, "title_ar": ar, "kind": "flow", "refs": [], "steps": 0}
                add(id=cur["id"], kind=cur["kind"], doc="06", title_en=cur["title_en"], title_ar=cur["title_ar"], doc_version=ver)
            continue
        rows = rest[0]
        if not rows or cur is None:
            continue
        head = [cell_text(c) for c in rows[0]]
        if cur["kind"] == "flow" and len(head) == 2 and head[0].startswith("Stories"):
            cur["refs"] = expand_refs(head[0])
            register[-1]["refs"] = ", ".join(cur["refs"])
        elif cur["kind"] == "flow" and head[:2] == ["#", "Actor"]:
            screens = []
            for r in rows[1:]:
                vals = [cell_text(c) for c in r] + [""] * 5
                steps.append({"flow_id": cur["id"], "step": vals[0], "actor": vals[1], "step_en": vals[2], "step_ar": vals[3], "screen": vals[4]})
                screens += ID_RE.findall(vals[4])
            register[-1]["step_count"] = str(len(rows) - 1)
            register[-1]["summary_en"] = short("Screens: " + ", ".join(dict.fromkeys(screens)))
            register[-1]["refs"] = ", ".join(dict.fromkeys(cur["refs"] + screens))
        elif cur["kind"] == "state_table" and head[0] == "State":
            for r in rows[1:]:
                vals = [cell_text(c) for c in r] + [""] * 5
                states.append({"entity": cur["title_en"], "state_en": vals[0], "state_ar": vals[1], "meaning_en": vals[2],
                               "meaning_ar": vals[3], "next_states": vals[4], "source": "06 · State tables"})
            register[-1]["state_count"] = str(len(rows) - 1)
            register[-1]["summary_en"] = short("States: " + ", ".join(cell_text(r[0]) for r in rows[1:]))


# ---------------------------------------------------------------- main

def write(name, rows, cols=None):
    cols = cols or (list(rows[0].keys()) if rows else [])
    with open(os.path.join(OUT, name), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..")
    files = {d: os.path.join(src, n) for d, n in {
        "00": "OrgTik_00_Index_Gaps_Decisions.docx",
        "01": "OrgTik_01_User_Stories_Customer.docx",
        "02": "OrgTik_02_User_Stories_Admin.docx",
        "03": "OrgTik_03_Pricing_Zones_MultiCurrency_Spec.docx",
        "04": "OrgTik_04_Admin_Dashboard_Screens.docx",
        "05": "OrgTik_05_User_Dashboard_Screens.docx",
        "06": "OrgTik_06_Flows_and_States.docx",
    }.items()}
    missing = [p for p in files.values() if not os.path.exists(p)]
    if missing:
        sys.exit("Missing spec files:\n  " + "\n  ".join(missing))
    ver = {d: version_of(p) for d, p in files.items()}
    parse_00(files["00"], ver["00"])
    parse_stories(files["01"], "01", ver["01"])
    parse_stories(files["02"], "02", ver["02"])
    parse_03(files["03"], ver["03"])
    parse_screens(files["04"], "04", ver["04"])
    parse_screens(files["05"], "05", ver["05"])
    parse_06(files["06"], ver["06"])

    # Reverse links: which screens and flows point at each story, screen or gap. This is
    # what the gap analysis walks ("which screen delivers US-C-12?").
    back = {}
    for r in register:
        for ref in [x.strip() for x in r["refs"].split(",") if x.strip()]:
            back.setdefault(ref, []).append(r["id"])
    for r in register:
        r["referenced_by"] = ", ".join(dict.fromkeys(back.get(r["id"], [])))

    os.makedirs(OUT, exist_ok=True)
    write("spec-register.csv", register, REGISTER_COLS)
    write("screen-fields.csv", fields)
    write("flow-steps.csv", steps)
    write("states.csv", states)
    write("permission-matrix.csv", permissions)
    write("terms.csv", terms)

    from collections import Counter
    c = Counter(r["kind"] for r in register)
    sys.stdout.reconfigure(encoding="utf-8")
    print("spec-register.csv:", len(register), "items ·", ", ".join(f"{k} {v}" for k, v in sorted(c.items())))
    print(f"screen-fields.csv: {len(fields)} · flow-steps.csv: {len(steps)} · states.csv: {len(states)} · "
          f"permission-matrix.csv: {len(permissions)} modules · terms.csv: {len(terms)}")


if __name__ == "__main__":
    main()
