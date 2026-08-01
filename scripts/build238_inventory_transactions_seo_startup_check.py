#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json,re,sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def text(path):
    p=ROOT/path
    if not p.exists():
        errors.append(f'missing {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='ignore')

def need(path,*needles):
    value=text(path)
    for needle in needles:
        if needle not in value: errors.append(f'{path} missing {needle}')

required=[
 'sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql',
 'functions/api/admin/catalog_inventory_bulk_update.js',
 'functions/api/admin/catalog_inventory_merge.js','functions/api/admin/catalog_inventory_audit_list.js',
 'admin-inventory-manager.html','admin-roadmap-execution.html','admin-startup-guide.html',
 'data/build238_next_steps.json','data/build238_go_live_blockers.json',
 'docs/BUILD238_INVENTORY_TRANSACTIONS_SEO_STARTUP_POLISH.md',
 'docs/SEO_COMPETITIVE_REVIEW_BUILD238.md','docs/MARKDOWN_GOVERNANCE_BUILD238.md',
 'data/build238_inventory_transactions_seo_startup.json','data/markdown_sanity_build238.json'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'missing {rel}')

need('sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql',
     'catalog_inventory_change_batches','catalog_inventory_change_batch_rows','catalog_inventory_merge_audit',
     'admin_catalog_inventory_bulk_update','admin_catalog_inventory_merge','p_dry_run',
     'Only inventory rows of the same type can be merged','different units','duplicate_action',
     'update public.app_roadmap_execution_items set is_current_cycle=false')
need('SUPABASE_SCHEMA.sql','admin_catalog_inventory_bulk_update','admin_catalog_inventory_merge','catalog_inventory_merge_audit')
need('DATABASE_STRUCTURE_CURRENT.md','Database Structure — Build 238 Current Additions','service_role')
need('functions/api/admin/catalog_inventory_bulk_update.js','migration_required','p_dry_run','normalizeChanges','manage_staff')
need('functions/api/admin/catalog_inventory_merge.js','migration_required','p_survivor_item_key','p_duplicate_item_key','manage_staff')
need('functions/api/admin/catalog_inventory_audit_list.js','catalog_inventory_change_batches','catalog_inventory_merge_audit','migration_required','manage_staff')
need('admin-inventory-manager.html','catalog_inventory_bulk_update','catalog_inventory_merge','rosie_inventory_workbench_cache_v238','requireWritable','Review two-row merge','Preview batch','Apply transaction','Transaction & merge history','catalog_inventory_audit_list','exportAuditCsv')
need('admin-roadmap-execution.html','Build 238 · current-cycle execution','build238_next_steps.json','/assets/site.css?v=20260730build238')
need('admin-startup-guide.html','Build 238 · detailed launch sequence','build238_go_live_blockers.json')
need('service-worker.js','rosie-app-v20260730build238','/data/build238_go_live_blockers.json','/data/build238_next_steps.json')
need('assets/visual-placeholders.js','inventory_merge','inventory_audit','transactional_batch','seo_preflight')
need('AI_PROJECT_HANDOFF.md','Build 238 operational release')
need('MASTER_VALUE_ROADMAP.md','Build 238 — Inventory transactions')
need('STARTUP_GO_LIVE_BLOCKERS.md','Startup and Go-Live Blocker Guide — Build 238')
need('KNOWN_GAPS_AND_RISKS.md','Known Issues and Gaps — Build 238')

# JSON shape and current-cycle counts.
for rel,min_items,build in [('data/build238_next_steps.json',20,238),('data/build238_go_live_blockers.json',25,238)]:
    try:
        data=json.loads(text(rel))
        if data.get('build')!=build: errors.append(f'{rel} build is not {build}')
        if len(data.get('items',[]))<min_items: errors.append(f'{rel} has fewer than {min_items} items')
    except Exception as exc: errors.append(f'{rel} invalid JSON: {exc}')

# All Markdown receives the current authority marker.
for p in ROOT.rglob('*.md'):
    if 'Build 238 synchronization (2026-07-30)' not in p.read_text(encoding='utf-8',errors='ignore'):
        errors.append(f'Markdown not synchronized: {p.relative_to(ROOT)}')

# Local stylesheet/script dependencies must resolve; pages using AdminShell must load it.
for p in ROOT.rglob('*.html'):
    value=p.read_text(encoding='utf-8',errors='ignore')
    for attr in ('href','src'):
        for target in re.findall(rf'{attr}=["\']([^"\']+)["\']',value,re.I):
            clean=target.split('?',1)[0].split('#',1)[0]
            if clean.startswith('/') and clean.lower().endswith(('.css','.js')) and not (ROOT/clean.lstrip('/')).exists():
                errors.append(f'{p.relative_to(ROOT)} missing local asset {clean}')
    if 'AdminShell.boot' in value and '/assets/admin-shell.js' not in value:
        errors.append(f'{p.relative_to(ROOT)} calls AdminShell without admin-shell.js')
    h1=len(re.findall(r'<h1\b',value,re.I))
    if h1>1: errors.append(f'{p.relative_to(ROOT)} has {h1} H1 elements')

# Route copies touched by this release must match.
route_names=['admin-inventory-manager','admin-roadmap-execution','admin-startup-guide','services','pricing','book','gallery','gift-cards','videos','specials','about','fleet','consumables','maintenance','fleet-pricing','gifts','maintenance-plan','contact','faq','gear','blog','zorra-thamesford-embro-auto-detailing','port-rowan-turkey-point-auto-detailing']
for name in route_names:
    a=ROOT/f'{name}.html'; b=ROOT/name/'index.html'
    if a.exists() and b.exists() and a.read_bytes()!=b.read_bytes(): errors.append(f'route copy drift: {name}')

# Indexable public pages must have concise metadata. noindex and protected routes are excluded.
class MetaParser(HTMLParser):
    def __init__(self): super().__init__(); self.title=''; self.in_title=False; self.description=''; self.robots=''
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag.lower()=='title': self.in_title=True
        if tag.lower()=='meta':
            name=(attrs.get('name') or '').lower()
            if name=='description': self.description=(attrs.get('content') or '').strip()
            if name=='robots': self.robots=(attrs.get('content') or '').lower()
    def handle_endtag(self,tag):
        if tag.lower()=='title': self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title+=data
for p in ROOT.rglob('*.html'):
    rel=p.relative_to(ROOT)
    parser=MetaParser(); parser.feed(p.read_text(encoding='utf-8',errors='ignore'))
    protected=any(part.startswith(('admin','client','detailer','staff','login')) for part in rel.parts)
    if 'noindex' in parser.robots or protected: continue
    title=parser.title.strip(); desc=parser.description.strip()
    if not title or len(title)>65: errors.append(f'{rel} public title length {len(title)}')
    if not desc or len(desc)>165: errors.append(f'{rel} public description length {len(desc)}')

# The Workbench must not revert to an authoritative sequential write loop.
manager=text('admin-inventory-manager.html')
if re.search(r'for\s*\([^)]*selected[^)]*\).*catalog_inventory_save',manager,re.S):
    errors.append('Inventory Workbench appears to use sequential catalog_inventory_save for selected bulk rows')

if errors:
    print('Build 238 check failed:')
    for item in errors: print('-',item)
    sys.exit(1)
print('Build 238 inventory transaction, merge, fallback, SEO, CSS, route, schema, Startup and Markdown checks passed.')
