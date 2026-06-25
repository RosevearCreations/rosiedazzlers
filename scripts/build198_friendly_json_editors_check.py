#!/usr/bin/env python3
"""Build 198 guard: friendly admin editors replacing routine raw JSON editing."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
missing = []

def read(rel):
    path = ROOT / rel
    if not path.exists():
        missing.append(f"{rel}: missing file")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")

def need(rel, needles):
    text = read(rel)
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel}: missing {needle!r}")
    return text

for rel in ["admin-app.html", "admin-app/index.html"]:
    need(rel, [
        'data-build198="friendly-json-editors"',
        'socialFeedStructuredEditor',
        'beforeAfterGalleryStructuredEditor',
        'renderSocialFeedsStructuredEditor',
        'renderBeforeAfterGalleryStructuredEditor',
        'applySocialFeedsJsonToStructuredEditor',
        'applyBeforeAfterGalleryJsonToStructuredEditor',
        'Advanced social feed JSON',
        'Advanced gallery JSON',
        'Add platform',
        'Add gallery row',
        'Consent status'
    ])

for rel in ["admin-water-rules.html", "admin-water-rules/index.html"]:
    need(rel, [
        'data-build198="friendly-water-rule-editor"',
        'Friendly water-rule editor',
        'data-water-rule-editor',
        'data-add-water-rule',
        'normalizeRule',
        'renderEditor',
        'Advanced water-rule JSON',
        'Official source URL',
        'Next review date'
    ])

if read("admin-app.html") != read("admin-app/index.html"):
    missing.append("admin-app route copy must match root file")
if read("admin-water-rules.html") != read("admin-water-rules/index.html"):
    missing.append("admin-water-rules route copy must match root file")

for rel in ["DEVELOPMENT_ROADMAP.md", "KNOWN_GAPS_AND_RISKS.md", "DATABASE_STRUCTURE_CURRENT.md", "SUPABASE_SCHEMA.sql", "README.md", "DOC_INDEX.md"]:
    need(rel, ["Build 198", "friendly"])
need("sql/2026-06-07_build198_friendly_json_editors_no_ddl_note.sql", ["Build 198", "No database schema changes"])

if missing:
    print("Build 198 friendly JSON editors check failed:")
    for item in missing:
        print(" -", item)
    sys.exit(1)
print("Build 198 friendly JSON editors check passed.")
