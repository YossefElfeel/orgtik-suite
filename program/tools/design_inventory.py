"""Inventory of the design values the new website actually uses: the raw material for @orgtik/ui's tokens.

    python tools/design_inventory.py

Reads the website's page components (inline style objects in src/reference/*.jsx) and its
stylesheets (src/reference/*.css, without the icon-font files). Counts every:
    colour          hex, rgb() and hsl() literals anywhere in a value, as #RRGGBB or #RRGGBBAA
    type value      font-size, font-weight, line-height, letter-spacing, font-family
    shape           border-radius, box-shadow
    motion          timing functions and durations in transition/animation values
    breakpoint      @media widths in CSS, innerWidth/matchMedia widths in JS

Each colour is also matched to its nearest brand colour (ORGTIK.pdf p.8 and the site's own
base colours), with the perceptual distance in OKLab, so the inventory shows which colours are
brand-true and which drifted.

Writes design-tokens/inventory.csv (every value with counts and files) and inventory.md.
"""
import csv
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

PROGRAM = Path(__file__).resolve().parent.parent
SITE = PROGRAM.parent / "orgtik-website" / "landing-directions" / "src" / "reference"
OUT = PROGRAM / "design-tokens"

BRAND = {
    # ORGTIK.pdf p.8
    "plum-950 #190B25": "#190B25",
    "plum-800 #3B1E59": "#3B1E59",
    "plum-600 #6C3CAA": "#6C3CAA",
    "plum-500 #9458F4": "#9458F4",
    "indigo-950 #121649": "#121649",
    "indigo-800 #243089": "#243089",
    "indigo-600 #394BC6": "#394BC6",
    "indigo-500 #4157F7": "#4157F7",
    # The site's own base colours
    "night #0D0814 (site base)": "#0D0814",
    "pill #EEE3F7 (primary pill)": "#EEE3F7",
    "pill-ink #28123B (pill text)": "#28123B",
    "surface #EEE8F7 (light surface)": "#EEE8F7",
    "white": "#FFFFFF",
    "black": "#000000",
}

PROPS = {
    "font-size", "font-weight", "line-height", "letter-spacing", "font-family", "border-radius", "box-shadow",
    "transition", "transition-timing-function", "transition-duration", "animation", "animation-timing-function", "animation-duration",
}

HEX = re.compile(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b")
RGB = re.compile(r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)")
EASE = re.compile(r"cubic-bezier\([^)]*\)|\b(?:ease-in-out|ease-in|ease-out|ease|linear|steps\([^)]*\))\b")
DUR = re.compile(r"(?<![\w.])(\d*\.?\d+)(ms|s)\b")
# Inline styles: prop: "value" or prop: number. CSS: prop: value;
JSX_DECL = re.compile(r"\b([a-zA-Z]+)\s*:\s*(\"[^\"\n]*\"|'[^'\n]*'|-?\d+(?:\.\d+)?)(?=\s*[,}\n])")
CSS_DECL = re.compile(r"([a-z-]+)\s*:\s*([^;{}]+);")
MEDIA = re.compile(r"@media[^{]*?\((?:max|min)-width\s*:\s*(\d+)px\)")
JS_WIDTH = re.compile(r"innerWidth\s*[<>]=?\s*(\d{3,4})|\((?:max|min)-width:\s*(\d{3,4})px\)")


def kebab(name):
    return re.sub(r"([A-Z])", lambda m: "-" + m.group(1).lower(), name)


def norm_hex(h):
    h = h[1:].upper()
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h)
    if len(h) == 8 and h.endswith("FF"):
        h = h[:6]
    return "#" + h


def rgb_to_hex(r, g, b, a):
    out = "#%02X%02X%02X" % (round(float(r)), round(float(g)), round(float(b)))
    if a is not None:
        alpha = float(a[:-1]) / 100 if a.endswith("%") else float(a)
        if alpha < 1:
            out += "%02X" % round(alpha * 255)
    return out


def srgb_to_oklab(hex_):
    r, g, b = (int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5))
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in (r, g, b)]
    l = 0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]
    m = 0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]
    s = 0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def nearest_brand(hex_):
    lab = srgb_to_oklab(hex_[:7])
    best = min(BRAND.items(), key=lambda kv: math.dist(lab, srgb_to_oklab(kv[1])))
    return best[0], math.dist(lab, srgb_to_oklab(best[1]))


def sources():
    for f in sorted(SITE.glob("*.jsx")):
        yield f, "jsx"
    for f in sorted(SITE.glob("*.css")):
        if not f.name.startswith("icons-"):
            yield f, "css"


def main():
    values = defaultdict(Counter)  # kind -> value -> count
    files = defaultdict(set)  # (kind, value) -> files
    for f, kind in sources():
        text = f.read_text(encoding="utf-8", errors="ignore")
        decls = []
        if kind == "jsx":
            for m in JSX_DECL.finditer(text):
                prop, val = kebab(m.group(1)), m.group(2).strip("\"'")
                if m.group(2)[0] not in "\"'" and prop in {"font-size", "border-radius", "letter-spacing"}:
                    val += "px"  # React adds px to unitless numbers for these
                decls.append((prop, val))
        else:
            decls = [(m.group(1), m.group(2).strip()) for m in CSS_DECL.finditer(text)]
            for m in MEDIA.finditer(text):
                values["breakpoint"][f"{m.group(1)}px"] += 1
                files[("breakpoint", f"{m.group(1)}px")].add(f.name)
        for m in JS_WIDTH.finditer(text) if kind == "jsx" else []:
            w = m.group(1) or m.group(2)
            values["breakpoint"][f"{w}px"] += 1
            files[("breakpoint", f"{w}px")].add(f.name)

        def add(k, v):
            values[k][v] += 1
            files[(k, v)].add(f.name)

        for prop, val in decls:
            for h in HEX.findall(val):
                add("color", norm_hex(h))
            for r, g, b, a in RGB.findall(val):
                add("color", rgb_to_hex(r, g, b, a or None))
            if prop in PROPS:
                if prop.startswith(("transition", "animation")):
                    for e in EASE.findall(val):
                        add("easing", e.replace(" ", ""))
                    for n, unit in DUR.findall(val):
                        ms = float(n) * (1000 if unit == "s" else 1)
                        add("duration", f"{ms:g}ms")
                else:
                    add(prop, re.sub(r"\s+", " ", val))

    OUT.mkdir(exist_ok=True)
    with open(OUT / "inventory.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["kind", "value", "count", "nearest_brand", "oklab_distance", "files"])
        for kind in sorted(values):
            for v, n in values[kind].most_common():
                near, dist = nearest_brand(v) if kind == "color" else ("", "")
                w.writerow([kind, v, n, near, f"{dist:.3f}" if dist != "" else "", " ".join(sorted(files[(kind, v)]))])

    colours = values["color"]
    total = sum(colours.values())
    md = [
        "# Design inventory: what the new website actually uses",
        "",
        "Generated by `tools/design_inventory.py` from the website at `d76ee3b` (the D-031 baseline): the inline styles in `src/reference/*.jsx` and the stylesheets, without the icon fonts. Counts are occurrences in source, not on screen.",
        "",
        "## Colours",
        "",
        f"**{len(colours)} distinct colours** in {total} occurrences. 'Distance' is the perceptual distance (OKLab) to the nearest brand colour; under about 0.02 reads as the same colour.",
        "",
        "| Colour | Uses | Nearest brand colour | Distance |",
        "|---|---|---|---|",
    ]
    for v, n in colours.most_common(40):
        near, dist = nearest_brand(v)
        md.append(f"| `{v}` | {n} | {near} | {dist:.3f} |")
    far = [(v, n, *nearest_brand(v)) for v, n in colours.items()]
    on_brand = sum(n for v, n, _, d in far if d < 0.02)
    md += [
        "",
        f"{on_brand} of {total} occurrences ({on_brand * 100 // max(total, 1)}%) are within 0.02 of a brand colour. The full list is in `inventory.csv`.",
        "",
    ]
    for kind, title in [
        ("font-size", "Font sizes"),
        ("font-weight", "Font weights"),
        ("line-height", "Line heights"),
        ("letter-spacing", "Letter spacing"),
        ("font-family", "Font families"),
        ("border-radius", "Radii"),
        ("box-shadow", "Shadows"),
        ("easing", "Easings"),
        ("duration", "Durations"),
        ("breakpoint", "Breakpoints"),
    ]:
        c = values[kind]
        if not c:
            continue
        md += [f"## {title}", "", f"{len(c)} distinct values.", "", "| Value | Uses |", "|---|---|"]
        for v, n in c.most_common(25 if kind not in ("box-shadow", "font-family") else 12):
            md.append(f"| `{v}` | {n} |")
        md.append("")
    (OUT / "inventory.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"{len(colours)} colours, " + ", ".join(f"{len(values[k])} {k}" for k in ["font-size", "font-weight", "line-height", "letter-spacing", "border-radius", "box-shadow", "easing", "duration", "breakpoint"]) + " -> design-tokens/inventory.{csv,md}")


if __name__ == "__main__":
    main()
