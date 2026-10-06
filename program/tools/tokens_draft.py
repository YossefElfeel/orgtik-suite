"""Tokens v0 for @orgtik/ui, built from the brand and the website, with a WCAG contrast table.

    python tools/tokens_draft.py

Primitive ramps: every brand colour (ORGTIK.pdf p.8) and every colour the website leans on
(design-tokens/inventory.md) sits exactly on a step; the steps between them are interpolated in
OKLCH, so each ramp changes evenly to the eye. Status ramps (success, warning, danger) are
generated at the same lightness curve, so tones stay balanced next to plum.

Semantic tokens (light and dark) follow the approved plan's table. Every text and UI pair is
checked against WCAG 2.2: 4.5:1 for text, 3:1 for large text and for UI parts (focus rings,
field borders).

Writes design-tokens/tokens.v0.json (W3C design tokens format), contrast.md and swatches.csv.
"""
import csv
import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "design-tokens"
STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]


# ---------------------------------------------------------------- colour maths (OKLab / OKLCH)
def hex_to_rgb(h):
    return tuple(int(h[i : i + 2], 16) / 255 for i in (1, 3, 5))


def rgb_to_hex(rgb):
    return "#" + "".join("%02X" % round(max(0, min(1, c)) * 255) for c in rgb)


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def to_gamma(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def hex_to_oklch(h):
    r, g, b = (to_linear(c) for c in hex_to_rgb(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360


def oklch_to_rgb(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    lin = (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )
    return lin


def oklch_to_hex(L, C, h):
    # Out of the sRGB gamut: lower the chroma, keep lightness and hue.
    for _ in range(40):
        lin = oklch_to_rgb(L, C, h)
        if all(-1e-4 <= c <= 1 + 1e-4 for c in lin):
            break
        C *= 0.95
    return rgb_to_hex(tuple(to_gamma(max(0, min(1, c))) for c in oklch_to_rgb(L, C, h)))


def lerp_hue(a, b, t):
    d = ((b - a + 180) % 360) - 180
    return (a + d * t) % 360


def ramp(anchors):
    """anchors: {step: hex}. Missing steps are interpolated in OKLCH between the nearest anchors."""
    known = sorted(anchors)
    out = {}
    for s in STEPS:
        if s in anchors:
            out[s] = anchors[s].upper()
            continue
        lo = max((k for k in known if k < s), default=None)
        hi = min((k for k in known if k > s), default=None)
        if lo is None or hi is None:
            raise ValueError(f"step {s} needs anchors on both sides")
        t = (s - lo) / (hi - lo)
        (l1, c1, h1), (l2, c2, h2) = hex_to_oklch(anchors[lo]), hex_to_oklch(anchors[hi])
        out[s] = oklch_to_hex(l1 + (l2 - l1) * t, c1 + (c2 - c1) * t, lerp_hue(h1, h2, t))
    return out


def generated(hue, chroma_peak, anchors=None):
    """A status ramp on a fixed lightness curve, optionally pinned to known colours."""
    lightness = {50: 0.975, 100: 0.945, 200: 0.89, 300: 0.81, 400: 0.72, 500: 0.63, 600: 0.54, 700: 0.46, 800: 0.38, 900: 0.30, 950: 0.22}
    shape = {50: 0.12, 100: 0.22, 200: 0.42, 300: 0.66, 400: 0.86, 500: 1.0, 600: 0.96, 700: 0.86, 800: 0.72, 900: 0.56, 950: 0.42}
    out = {s: oklch_to_hex(lightness[s], chroma_peak * shape[s], hue) for s in STEPS}
    out.update({k: v.upper() for k, v in (anchors or {}).items()})
    return out


def luminance(h):
    r, g, b = (to_linear(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def composite(fg, bg):
    """#RRGGBBAA over an opaque background."""
    if len(fg) == 7:
        return fg
    a = int(fg[7:9], 16) / 255
    f, b = hex_to_rgb(fg[:7]), hex_to_rgb(bg)
    return rgb_to_hex(tuple(f[i] * a + b[i] * (1 - a) for i in range(3)))


def contrast(fg, bg):
    l1, l2 = luminance(composite(fg, bg)), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------- primitives
PRIMITIVES = {
    # Brand plum. Anchors: the manual's four (950, 800, 600, 500), the site's pill ink (900) and
    # the site's lavenders (300, 200, 100) and light canvas (50).
    "plum": ramp({950: "#190B25", 900: "#28123B", 800: "#3B1E59", 600: "#6C3CAA", 500: "#9458F4", 300: "#C9A0F3", 200: "#D4B7EC", 100: "#EEE3F7", 50: "#F6F1FA"}),
    # Brand indigo: the manual's four, lightened evenly towards white.
    "indigo": ramp({950: "#121649", 800: "#243089", 600: "#394BC6", 500: "#4157F7", 50: "#F3F4FF"}),
    # Mauve neutrals: the site's text and border colours on both backgrounds.
    "mauve": ramp({50: "#F7F3FA", 100: "#E9E0F0", 200: "#DCD0E6", 300: "#CFC2DB", 400: "#B5A6C4", 500: "#9D8BAE", 600: "#6E6178", 700: "#4A3A57", 950: "#161019"}),
    # Night: the dark surfaces, from the site's base.
    "night": {950: "#0D0814", 900: "#120A1B", 850: "#1A0D27", 800: "#21132D", 700: "#2C1B3B", 600: "#3A2A4B"},
    # Status. Danger keeps the site's only error colours (#A02544, #8A1F3A) at 600 and 700.
    "green": generated(152, 0.16),
    "amber": generated(68, 0.16),
    "red": generated(15, 0.19, {600: "#A02544", 700: "#8A1F3A"}),
}


def P(ramp_name, step):
    return PRIMITIVES[ramp_name][step]


# ---------------------------------------------------------------- semantic (light / dark)
# name: (light value, dark value, what it is)
SEMANTIC = {
    "bg-canvas": (P("plum", 50), P("night", 950), "The page background"),
    "bg-raised": ("#FFFFFF", P("night", 850), "Cards, tables, panels"),
    "bg-sunken": ("#EEE8F7", P("night", 900), "Wells, inputs' surroundings, table headers"),
    "bg-overlay": ("#FFFFFF", P("night", 800), "Dialogs, menus, popovers"),
    "bg-chrome": (P("plum", 950), P("night", 900), "The rail and sidebar: plum in both themes"),
    "fg": (P("plum", 950), P("plum", 50), "Primary text"),
    "fg-muted": (P("mauve", 700), P("mauve", 300), "Secondary text"),
    "fg-subtle": (P("mauve", 600), P("mauve", 400), "Hints, placeholders, metadata"),
    "fg-brand": (P("plum", 600), P("plum", 300), "Brand-coloured text and links"),
    "fg-on-chrome": (P("plum", 50), P("plum", 50), "Text on the rail and sidebar"),
    "fg-on-chrome-muted": (P("mauve", 300), P("mauve", 300), "Secondary text on the rail and sidebar"),
    "action-primary-bg": (P("plum", 600), P("plum", 100), "Primary buttons"),
    "action-primary-fg": ("#FFFFFF", P("plum", 900), "Text on primary buttons"),
    "action-brand-bg": (P("plum", 950), P("plum", 100), "The brand pill (with the arrow chip)"),
    "action-brand-fg": (P("plum", 50), P("plum", 900), "Text on the brand pill"),
    "focus": (P("plum", 600), "#B98AF7", "Focus rings"),
    "line": ("#DCD0E6", "#FFFFFF14", "Dividers and card borders"),
    "line-strong": ("#CFC2DB", "#FFFFFF2B", "Stronger separators"),
    "line-control": ("#8E7FA0", "#FFFFFF66", "Field and control borders (3:1 required)"),
    "success-fg": (P("green", 700), P("green", 300), "Success text and icons"),
    "success-subtle": (P("green", 50), "#12301F", "Success badge background"),
    "success-solid": (P("green", 600), P("green", 400), "Success fill"),
    "warning-fg": (P("amber", 800), P("amber", 300), "Warning text and icons"),
    "warning-subtle": (P("amber", 50), "#33240B", "Warning badge background"),
    "warning-solid": (P("amber", 400), P("amber", 400), "Warning fill (dark text on it)"),
    "danger-fg": (P("red", 700), P("red", 300), "Danger text and icons"),
    "danger-subtle": (P("red", 50), "#3A1320", "Danger badge background"),
    "danger-solid": (P("red", 600), P("red", 500), "Danger fill"),
    "info-fg": (P("indigo", 600), P("indigo", 300), "Information text and icons"),
    "info-subtle": (P("indigo", 50), "#171B45", "Information badge background"),
    "info-solid": (P("indigo", 600), P("indigo", 400), "Information fill"),
    # Text on a solid status fill. The dark theme's fills are lighter, to stand out on dark
    # surfaces, so their text turns dark: white on them would fall below 4.5:1.
    "success-on-solid": ("#FFFFFF", P("night", 950), "Text on the success fill"),
    "warning-on-solid": (P("plum", 950), P("night", 950), "Text on the warning fill"),
    "danger-on-solid": ("#FFFFFF", P("night", 950), "Text on the danger fill"),
    "info-on-solid": ("#FFFFFF", P("night", 950), "Text on the information fill"),
}

# Pairs that must meet WCAG: (foreground, background, minimum, what it is)
CHECKS = [
    *[(fg, bg, 4.5, "text") for fg in ["fg", "fg-muted", "fg-subtle", "fg-brand"] for bg in ["bg-canvas", "bg-raised", "bg-sunken", "bg-overlay"]],
    ("fg-on-chrome", "bg-chrome", 4.5, "text"),
    ("fg-on-chrome-muted", "bg-chrome", 4.5, "text"),
    ("action-primary-fg", "action-primary-bg", 4.5, "text"),
    ("action-brand-fg", "action-brand-bg", 4.5, "text"),
    *[("focus", bg, 3.0, "UI") for bg in ["bg-canvas", "bg-raised", "bg-overlay"]],
    *[("line-control", bg, 3.0, "UI") for bg in ["bg-canvas", "bg-raised", "bg-sunken"]],
    *[(f"{t}-fg", f"{t}-subtle", 4.5, "text") for t in ["success", "warning", "danger", "info"]],
    *[(f"{t}-fg", "bg-raised", 4.5, "text") for t in ["success", "warning", "danger", "info"]],
    *[(f"{t}-on-solid", f"{t}-solid", 4.5, "text") for t in ["success", "warning", "danger", "info"]],
]


def value(name, theme):
    if name.startswith("#"):
        return name
    light, dark, _ = SEMANTIC[name]
    return light if theme == "light" else dark


def main():
    OUT.mkdir(exist_ok=True)
    rows, failures = [], []
    for fg, bg, need, kind in CHECKS:
        for theme in ("light", "dark"):
            fv, bv = value(fg, theme), value(bg, theme)
            bv_opaque = composite(bv, value("bg-canvas", theme)) if len(bv) == 9 else bv
            ratio = contrast(fv, bv_opaque)
            ok = ratio >= need
            rows.append((theme, fg, bg, fv, bv, ratio, need, kind, ok))
            if not ok:
                failures.append((theme, fg, bg, ratio, need))

    tokens = {
        "$description": "OrgTik tokens v0 (session 7). Primitives from the brand manual and the website; semantic sets for light and dark. Proposed, for G1a.",
        "color": {name: {str(s): {"$type": "color", "$value": v} for s, v in r.items()} for name, r in PRIMITIVES.items()},
        "semantic": {
            theme: {name: {"$type": "color", "$value": (l if theme == "light" else d), "$description": desc} for name, (l, d, desc) in SEMANTIC.items()}
            for theme in ("light", "dark")
        },
        "radius": {k: {"$type": "dimension", "$value": v} for k, v in {"pill": "999px", "field": "12px", "card": "20px", "overlay": "16px", "panel": "24px"}.items()},
        "duration": {k: {"$type": "duration", "$value": v} for k, v in {"instant": "90ms", "fast": "120ms", "base": "200ms", "slow": "300ms", "reveal": "480ms"}.items()},
        "easing": {
            "out": {"$type": "cubicBezier", "$value": [0.22, 1, 0.36, 1], "$description": "The site's main easing (147 uses)"},
            "out-strong": {"$type": "cubicBezier", "$value": [0.16, 1, 0.3, 1], "$description": "The site's entrance easing"},
        },
        "font": {
            "display": {"$type": "fontFamily", "$value": ["IBM Plex Sans Arabic", "Montserrat", "Arial", "sans-serif"], "$description": "Headings. IBM Plex Sans Arabic (D-010) is limited to Arabic characters, so Latin falls through to Montserrat"},
            "body": {"$type": "fontFamily", "$value": ["IBM Plex Sans Arabic", "Arial", "Helvetica", "sans-serif"], "$description": "Body. The site's body face is Arial (159 uses); Arabic uses IBM Plex Sans Arabic (D-010)"},
        },
    }
    (OUT / "tokens.v0.json").write_text(json.dumps(tokens, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    with open(OUT / "swatches.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["ramp", "step", "hex", "oklch_L", "oklch_C", "oklch_h", "contrast_on_white", "contrast_on_night_950"])
        for name, r in PRIMITIVES.items():
            for s, v in r.items():
                L, C, h = hex_to_oklch(v)
                w.writerow([name, s, v, f"{L:.3f}", f"{C:.3f}", f"{h:.0f}", f"{contrast(v, '#FFFFFF'):.2f}", f"{contrast(v, '#0D0814'):.2f}"])

    md = [
        "# Contrast: tokens v0 against WCAG 2.2",
        "",
        "Generated by `tools/tokens_draft.py`. Text needs 4.5:1. UI parts (focus rings, field borders) need 3:1. Translucent colours are measured over the background they sit on.",
        "",
        f"**{len(rows) - len(failures)} of {len(rows)} pairs pass.**" + (" Failures are listed first." if failures else ""),
        "",
        "| Theme | Foreground | Background | Colours | Ratio | Needs | Result |",
        "|---|---|---|---|---|---|---|",
    ]
    for theme, fg, bg, fv, bv, ratio, need, kind, ok in sorted(rows, key=lambda r: (r[8], r[0], r[1])):
        md.append(f"| {theme} | `{fg}` | `{bg}` | `{fv}` on `{bv}` | {ratio:.2f} | {need:g} ({kind}) | {'pass' if ok else '**fail**'} |")
    md += ["", "## Brand notes", ""]
    md.append(f"- `#9458F4` (plum-500) with white text: {contrast('#FFFFFF', '#9458F4'):.2f}:1, below 4.5. It never carries small white text; it's for glows, accents and large type.")
    md.append(f"- `#6C3CAA` (plum-600) with white text: {contrast('#FFFFFF', '#6C3CAA'):.2f}:1, the light theme's primary button.")
    md.append(f"- The site's field border `#FFFFFF2B` on `#0D0814`: {contrast(composite('#FFFFFF2B', '#0D0814'), '#0D0814'):.2f}:1, below the 3:1 a control needs. That's why `line-control` is stronger than the site's lines.")
    (OUT / "contrast.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"{len(rows) - len(failures)}/{len(rows)} contrast pairs pass -> design-tokens/tokens.v0.json, contrast.md, swatches.csv")
    for f in failures:
        print("  FAIL", f)


if __name__ == "__main__":
    main()
