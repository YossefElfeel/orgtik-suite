"""Adds (or replaces) message keys in all five catalogs at once, so they stay at parity.

    python scripts/add-messages.py scripts/messages/<file>.json

The input maps a dotted key to its five texts: {"Errors.retry": {"en": "...", "ar": "...", ...}}.
A value of null removes the key everywhere.
"""
import json, os, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "messages"
LOCALES = ["en", "ar", "de", "fr", "it"]

def main(path):
    adds = json.loads(Path(path).read_text(encoding="utf-8"))
    for loc in LOCALES:
        p = ROOT / f"{loc}.json"
        data = json.loads(p.read_text(encoding="utf-8"))
        for key, texts in adds.items():
            parts = key.split(".")
            node = data
            for part in parts[:-1]:
                node = node.setdefault(part, {})
            if texts is None:
                node.pop(parts[-1], None)
                continue
            if loc not in texts:
                raise SystemExit(f"{key}: no {loc}")
            node[parts[-1]] = texts[loc]
        # Drop namespaces left empty by removals.
        for k in [k for k, v in data.items() if v == {}]:
            del data[k]
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(adds)} keys × {len(LOCALES)} catalogs")

# Several agents add keys at the same time: one writer at a time, or a catalog loses keys.
LOCK = ROOT / ".add-messages.lock"

def locked(fn):
    for _ in range(600):
        try:
            fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            break
        except FileExistsError:
            if time.time() - LOCK.stat().st_mtime > 60:
                LOCK.unlink(missing_ok=True)
            time.sleep(0.2)
    else:
        raise SystemExit("catalogs are locked")
    try:
        fn()
    finally:
        os.close(fd)
        LOCK.unlink(missing_ok=True)

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        locked(lambda: main(arg))
