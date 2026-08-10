from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def need(path,text,label=None):
    p=ROOT/path
    if not p.exists(): errors.append(f"missing {path}"); return
    data=p.read_text(errors='ignore')
    if text not in data: errors.append(f"{path}: missing {label or text}")
def forbid(path,text,label=None):
    p=ROOT/path
    if p.exists() and text in p.read_text(errors='ignore'): errors.append(f"{path}: still contains {label or text}")
need('admin-catalog.html','data-build249="supplier-refresh-inventory-recovery"','Build 249 marker')
need('admin-catalog.html','Repair or add inventory from an Amazon link')
need('admin-catalog.html','supplierOverwriteIdentity')
need('admin-catalog.html','supplierOverwriteClassification')
need('admin-catalog.html','supplierOverwriteDescription')
need('admin-catalog.html','supplierOverwritePrice')
need('admin-catalog.html','supplierOverwriteImage')
need('admin-catalog.html','editorTargetKey')
need('admin-catalog.html','keyInput.readOnly=true','existing item key lock')
need('admin-catalog.html','function mergeSupplierDraft')
need('admin-catalog.html','function supplierDiff')
need('admin-catalog.html','description:qs(\'#formDescription\').value.trim()','description persistence')
need('admin-catalog.html','...supplierMetaState','Amazon metadata persistence')
need('admin-catalog.html',"new URLSearchParams(location.search).get('item')",'deep link target')
need('admin-catalog.html','/assets/placeholders/inventory-tools-photo.jpg','intentional inventory placeholder')
forbid('admin-catalog.html','function parseAmazonDraft','old URL slug parser')
need('admin-inventory-manager.html','Amazon repair candidates')
need('admin-inventory-manager.html','Missing Amazon / supplier link')
need('admin-inventory-manager.html','Amazon refresh')
need('admin-inventory-manager.html','function supplierNeedsReview')
need('functions/api/admin/catalog_supplier_link_preview.js','function pick(html, ...patterns)','flexible parser helper')
need('functions/api/admin/catalog_supplier_link_preview.js','MAX_HTML_BYTES = 1_500_000','bounded supplier response')
need('functions/api/admin/catalog_inventory_save.js','amazon_asin:','Amazon metadata save')
need('functions/api/admin/catalog_inventory_save.js','description:','description save')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 249')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 249')
need('DOC_INDEX.md','# Documentation Index — Build 249')
need('STARTUP_GO_LIVE_BLOCKERS.md','## 41. Recover inaccurate supplies/tools with reviewed Amazon refresh')
need('docs/SUPPLIER_LINK_INVENTORY_IMPORT.md','# Build 249 — Existing-row Amazon repair workflow')
need('docs/SEO_COMPETITIVE_REVIEW_BUILD249.md','Google Business Profile')
need('data/build249_inventory_recovery.json','existing_inventory_supplier_refresh')
need('data/markdown_sanity_build249.json','"living_authorities"')
need('service-worker.js','rosie-app-v20260810build249','Build 249 cache version')
need('service-worker.js','/data/build249_inventory_recovery.json','Build 249 cached recovery data')
# Route-copy parity is expected after sync_route_copies.py.
for path in ['admin-catalog/index.html','admin-inventory-manager/index.html']:
    p=ROOT/path
    if p.exists():
        base=ROOT/(path.split('/')[0]+'.html')
        if base.exists() and p.read_text(errors='ignore') != base.read_text(errors='ignore'):
            errors.append(f'{path}: route copy drift')
if errors:
    print('Build 249 inventory supplier recovery check failed:')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Build 249 inventory supplier recovery check passed.')
