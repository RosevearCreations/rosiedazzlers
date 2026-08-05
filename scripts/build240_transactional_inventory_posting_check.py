#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def text(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f'missing {rel}'); return ''
 return p.read_text(encoding='utf-8',errors='replace')
def need(rel,*tokens):
 s=text(rel)
 for token in tokens:
  if token not in s: errors.append(f'{rel} missing {token}')
need('admin-inventory-posting.html','<h1','Inventory Posting & Reversal','/api/admin/catalog_inventory_post','/api/admin/catalog_inventory_post_reverse','read-only','data-visual-placeholder="inventory_transactional_posting_reversal"')
need('functions/api/admin/catalog_inventory_post.js','callInventoryPostingRpc','idempotency_key','migration_required','postInventoryUsageCOGS')
need('functions/api/admin/catalog_inventory_post_reverse.js','callInventoryReversalRpc','dry_run','manage_staff')
need('functions/api/admin/catalog_inventory_project_reservations.js','creative_project_inventory_reservations','shortage','can_post')
need('functions/api/admin/catalog_inventory_posting_list.js','catalog_inventory_posting_batches','catalog_inventory_posting_rows')
need('functions/api/admin/catalog_usage_add.js','callInventoryPostingRpc','client_action_id')
need('functions/api/catalog_usage_add.js','callInventoryPostingRpc','idempotency_key')
need('sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql','catalog_inventory_posting_batches','catalog_inventory_posting_rows','admin_catalog_inventory_post(','admin_catalog_inventory_post_reverse(','migration-240','b240_20','commit;')
need('SUPABASE_SCHEMA.sql','BEGIN BUILD 240 TRANSACTIONAL INVENTORY POSTING AND REVERSAL','catalog_inventory_posting_batches','admin_catalog_inventory_post_reverse')
need('assets/admin-menu.js','admin-inventory-posting','Inventory Posting')
need('assets/admin-auth.js','admin-inventory-posting')
need('service-worker.js','rosie-app-v20260805build240','/admin-inventory-posting.html','/data/build240_go_live_blockers.json')
need('docs/BUILD240_TRANSACTIONAL_INVENTORY_POSTING.md','one database transaction','compensating','read-only')
need('docs/SEO_COMPETITIVE_REVIEW_BUILD240.md','one clear H1','Google Business Profile')
for rel in ['data/build240_go_live_blockers.json','data/build240_next_steps.json','data/build240_inventory_posting_reversal.json','data/visual_placeholder_registry.json']:
 try: json.loads(text(rel))
 except Exception as e: errors.append(f'{rel} invalid JSON: {e}')
try:
 blockers=json.loads(text('data/build240_go_live_blockers.json'))
 ids={x.get('id') for x in blockers.get('items',[])}
 if blockers.get('build')!=240 or len(blockers.get('items',[]))<36: errors.append('Build 240 startup catalog must preserve at least 36 items')
 for key in ['migration-240','inventory-post-reversal-acceptance']:
  if key not in ids: errors.append(f'missing startup item {key}')
 steps=json.loads(text('data/build240_next_steps.json'))
 if len(steps.get('items',[]))!=20: errors.append('Build 240 next steps must contain 20 items')
except Exception: pass
# exactly one H1 on new page
page=text('admin-inventory-posting.html')
if len(re.findall(r'<h1\b',page,re.I))!=1: errors.append('admin-inventory-posting.html must contain exactly one H1')
# route copy parity
route=ROOT/'admin-inventory-posting/index.html'
if not route.exists() or route.read_text(encoding='utf-8',errors='replace')!=page: errors.append('admin-inventory-posting clean route drift')
# all markdown synchronized
marker='BUILD240_SYNC:'
md=list(ROOT.rglob('*.md'))
missing=[str(p.relative_to(ROOT)) for p in md if marker not in p.read_text(encoding='utf-8',errors='replace')]
if missing: errors.append(f'{len(missing)} Markdown files missing Build 240 sync marker: {missing[:5]}')
if errors:
 print('Build 240 check failed:')
 for e in errors: print('-',e)
 sys.exit(1)
print(f'Build 240 transactional inventory posting check passed ({len(md)} Markdown files synchronized).')
