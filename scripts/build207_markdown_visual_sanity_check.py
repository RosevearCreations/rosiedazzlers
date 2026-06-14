#!/usr/bin/env python3
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def read(rel): return (ROOT/rel).read_text(encoding='utf-8', errors='ignore')
def require_file(rel):
    p=ROOT/rel
    if not p.exists(): raise SystemExit(f"Missing {rel}")
    return read(rel)
def require(needle, rel):
    text=require_file(rel)
    if needle not in text: raise SystemExit(f"{rel} missing {needle!r}")

def main():
    for rel in [
        'AI_PROJECT_HANDOFF.md','MASTER_VALUE_ROADMAP.md','MARKDOWN_SANITY_BUILD207.md',
        'data/markdown_sanity_build207.json','data/visual_placeholder_registry.json','data/build207_enhancement_sweep.json',
        'admin-docs.html','admin-docs/index.html','assets/visual-placeholders.js',
        'functions/api/admin/markdown_sanity_report.js','functions/api/admin/visual_placeholder_report.js',
        'sql/2026-06-14_build207_markdown_visual_sanity_no_ddl_note.sql'
    ]: require_file(rel)
    require('Build 207 update', 'DEVELOPMENT_ROADMAP.md')
    require('Build 207 known gaps and risks', 'KNOWN_GAPS_AND_RISKS.md')
    require('Build 207 documentation index note', 'DOC_INDEX.md')
    require('Build 207 note', 'README.md')
    require('Build 207 Markdown consolidation', 'DATABASE_STRUCTURE_CURRENT.md')
    require('Build 207 Markdown consolidation', 'SUPABASE_SCHEMA.sql')
    require('admin-docs.html', 'scripts/sync_route_copies.py')
    require('ensureVisualPlaceholderSystem', 'assets/chrome.js')
    require('visual-placeholder-card', 'assets/site.css')
    require('markdownDocsDiagnostics', 'admin.html')
    print('Build 207 Markdown/visual sanity checks passed.')
if __name__ == '__main__':
    main()
