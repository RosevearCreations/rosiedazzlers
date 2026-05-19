#!/usr/bin/env python3
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BAD = []
for path in (ROOT / "functions" / "api").glob("*.js"):
    text = path.read_text(encoding="utf-8", errors="replace")
    if "../_lib/" in text:
        BAD.append(str(path.relative_to(ROOT)))
if BAD:
    print("Root API files still contain bad parent _lib imports:")
    for item in BAD:
        print("-", item)
    raise SystemExit(1)
print("stale_root_function_shims_check passed: no root functions/api/*.js file imports parent _lib.")
