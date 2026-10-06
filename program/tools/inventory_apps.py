"""Inventory every suite app's routes and components.

    python tools/inventory_apps.py

Writes to audits/inventory/:
    routes.csv      one row per page.tsx: URL pattern, file, size, client or server,
                    the nearest loading/error boundary, and whether any code links to it
    components.csv  every components/ui primitive and every shared component, with the
                    number of files that import it
    summary.json    per-app totals, and ui primitives by how many apps carry a copy

"linked_from_code" is a heuristic: a route counts as linked when a string in the app's
source (outside the page itself) matches its path, with ${…} or any segment standing in
for the dynamic parts. An unlinked route is only reachable by typing its URL, which is a
dead-end candidate for the audit, not a verdict.
"""

import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "..", "audits", "inventory")

APPS = {
    "sos": "somion-sos-frontend-main",
    "tasks": "task-manager-front-main",
    "files": "file-manager-dashboard-main",
    "sales": "sales-dashboardv2-main",
    "hr": "somion-hr-dashboard-main",
    "marketing": "digital-marketing-frontend-main",
    "content": "content-dashboard-somion-main",
    "chats": "somion-hq",
}
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "public", ".turbo"}
SRC_EXT = (".ts", ".tsx", ".js", ".jsx", ".mjs")


def walk(base):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            yield os.path.join(dirpath, f)


def read(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def route_of(page_rel):
    """app/[locale]/(dashboard)/projects/[id]/board/page.tsx -> ('/projects/:id/board', True)."""
    parts = page_rel.replace("\\", "/").split("/")[1:-1]  # drop "app" and "page.tsx"
    locale = False
    segs = []
    for p in parts:
        if p.startswith("(") and p.endswith(")"):
            continue  # route group
        if p == "[locale]":
            locale = True
            continue
        if p.startswith("[[...") or p.startswith("[..."):
            segs.append("*" + p.strip("[].").lstrip("."))
        elif p.startswith("[") and p.endswith("]"):
            segs.append(":" + p[1:-1])
        else:
            segs.append(p)
    return "/" + "/".join(segs), locale


def link_regex(route):
    """A regex that finds code linking to this route, e.g. `/projects/${id}/board`."""
    if route == "/":
        return None
    pieces = []
    for seg in route.strip("/").split("/"):
        if seg.startswith(":") or seg.startswith("*"):
            pieces.append(r"(?:\$\{[^}]+\}|[^\"'`/\s]+)")
        else:
            pieces.append(re.escape(seg))
    return re.compile(r"[\"'`](?:/[a-z]{2})?(?:\$\{[^}]+\})?/" + "/".join(pieces) + r"(?:[/?#\"'`]|\$\{)")


def nearest(app_dir, page_dir, name):
    """The closest ancestor boundary file (loading.tsx, error.tsx) inside app/, or ''."""
    d = page_dir
    app_root = os.path.join(app_dir, "app")
    while True:
        for ext in (".tsx", ".jsx", ".ts", ".js"):
            f = os.path.join(d, name + ext)
            if os.path.exists(f):
                return os.path.relpath(f, app_dir).replace("\\", "/")
        if os.path.normpath(d) == os.path.normpath(app_root):
            return ""
        d = os.path.dirname(d)


def main():
    os.makedirs(OUT, exist_ok=True)
    routes, components, summary = [], [], {"apps": {}, "ui_by_name": {}}

    for key, folder in APPS.items():
        app_dir = os.path.join(ROOT, folder)
        sources = {p: read(p) for p in walk(app_dir) if p.endswith(SRC_EXT)}
        pages = sorted(p for p in sources if os.path.basename(p) in ("page.tsx", "page.jsx") and os.sep + "app" + os.sep in p)

        for p in pages:
            rel = os.path.relpath(p, app_dir).replace("\\", "/")
            route, locale = route_of(rel)
            text = sources[p]
            rx = link_regex(route)
            sites = 0
            if rx:
                for other, body in sources.items():
                    if other != p and rx.search(body):
                        sites += 1
            routes.append({
                "app": key,
                "route": route,
                "locale_prefixed": "yes" if locale else "",
                "dynamic": "yes" if (":" in route or "*" in route) else "",
                "group": route.strip("/").split("/")[0] if route != "/" else "(root)",
                "file": f"{folder}/{rel}",
                "lines": text.count("\n") + 1,
                "client": "yes" if re.match(r"\s*[\"']use client[\"']", text) else "",
                "loading_boundary": nearest(app_dir, os.path.dirname(p), "loading"),
                "error_boundary": nearest(app_dir, os.path.dirname(p), "error"),
                "linked_from_code": "yes" if (sites or route == "/") else "no",
                "link_sites": sites,
            })

        # components/ui primitives and shared components
        comp_base = os.path.join(app_dir, "components")
        ui_dir = os.path.join(comp_base, "ui")
        entries = []
        if os.path.isdir(ui_dir):
            for f in sorted(os.listdir(ui_dir)):
                full = os.path.join(ui_dir, f)
                if os.path.isfile(full) and f.endswith((".tsx", ".ts")):
                    entries.append(("ui", os.path.splitext(f)[0], [full]))
                elif os.path.isdir(full):
                    entries.append(("ui", f, [x for x in walk(full) if x.endswith(SRC_EXT)]))
        for shared in ("shared", "special-shared"):
            sd = os.path.join(comp_base, shared)
            if os.path.isdir(sd):
                for f in sorted(os.listdir(sd)):
                    full = os.path.join(sd, f)
                    files = [full] if os.path.isfile(full) else [x for x in walk(full) if x.endswith(SRC_EXT)]
                    if files:
                        entries.append((shared, os.path.splitext(f)[0] if os.path.isfile(full) else f, files))
        for kind, name, files in entries:
            import_rx = re.compile(r"from\s+[\"'][^\"']*components/" + re.escape(kind) + "/" + re.escape(name) + r"(?:/[^\"']*)?[\"']")
            importers = sum(1 for p, body in sources.items() if p not in files and import_rx.search(body))
            components.append({
                "app": key, "kind": kind, "name": name,
                "path": os.path.relpath(files[0], ROOT).replace("\\", "/"),
                "files": len(files),
                "lines": sum(read(x).count("\n") + 1 for x in files),
                "imported_by": importers,
            })
            if kind == "ui":
                entry = summary["ui_by_name"].setdefault(name, {"apps": [], "import_sites": 0})
                if key not in entry["apps"]:  # form.tsx and a form/ folder in one app count once
                    entry["apps"].append(key)
                entry["import_sites"] += importers

        app_routes = [r for r in routes if r["app"] == key]
        summary["apps"][key] = {
            "folder": folder,
            "routes": len(app_routes),
            "dynamic_routes": sum(1 for r in app_routes if r["dynamic"]),
            "unlinked_routes": [r["route"] for r in app_routes if r["linked_from_code"] == "no"],
            "without_loading_boundary": sum(1 for r in app_routes if not r["loading_boundary"]),
            "without_error_boundary": sum(1 for r in app_routes if not r["error_boundary"]),
            "ui_components": sum(1 for c in components if c["app"] == key and c["kind"] == "ui"),
            "shared_components": sum(1 for c in components if c["app"] == key and c["kind"] != "ui"),
            "unused_components": [c["name"] for c in components if c["app"] == key and c["imported_by"] == 0],
        }

    def write(name, rows):
        with open(os.path.join(OUT, name), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    write("routes.csv", routes)
    write("components.csv", components)
    summary["ui_by_name"] = dict(sorted(summary["ui_by_name"].items(), key=lambda kv: (-len(kv[1]["apps"]), -kv[1]["import_sites"])))
    with open(os.path.join(OUT, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    sys.stdout.reconfigure(encoding="utf-8")
    print(f"routes.csv: {len(routes)} routes · components.csv: {len(components)} components")
    for k, s in summary["apps"].items():
        print(f"  {k:10} routes {s['routes']:3} (dynamic {s['dynamic_routes']:2}, unlinked {len(s['unlinked_routes']):2}) · "
              f"no loading {s['without_loading_boundary']:2} · no error {s['without_error_boundary']:2} · "
              f"ui {s['ui_components']:2} · shared {s['shared_components']:2} · unused {len(s['unused_components'])}")


if __name__ == "__main__":
    main()
