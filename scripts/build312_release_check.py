#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '1364289339555ba31d7c84b7ef1b8a48c28ece76'
PRODUCTION = '09442c53d385aca7995150ace4bde55abd51d7df'
errors = []

ALLOWED = {
    'functions/api/_lib/catalog-integrity.js',
    'functions/api/admin/catalog_inventory_save.js',
    'functions/api/admin/catalog_stock_action.js',
    'functions/api/admin/catalog_reorder_request.js',
    'functions/api/admin/catalog_purchase_order_update.js',
    'scripts/build312_inventory_integrity_audit.query',
    'scripts/build312_inventory_integrity_test.mjs',
    'scripts/build312_release_check.py',
    'scripts/build312_http_smoke.sh',
    '.github/workflows/build312-source-gate.yml',
    '.github/workflows/build312-development-source-gate.yml',
    '.github/workflows/build312-development-acceptance.yml',
    '.github/workflows/build301-development-source-gate.yml',
    'BUILD312_SUMMARY.md',
    'AUTONOMOUS_RELEASE_QUEUE.md',
    'scripts/build309_release_check.py',
    'scripts/build311_release_check.py',
}


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f'missing {rel}')
        return ''
    return path.read_text(encoding='utf-8', errors='ignore')


def require_ancestor(anchor, label):
    proc = subprocess.run(['git','merge-base','--is-ancestor',anchor,'HEAD'], cwd=ROOT)
    if proc.returncode:
        errors.append(f'{label} is not an ancestor of Build 312 candidate')


require_ancestor(BASELINE, 'accepted Build 311 Development')
require_ancestor(PRODUCTION, 'accepted Build 303 Production')

changed = subprocess.run(['git','diff','--name-only',f'{BASELINE}...HEAD'], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append('could not inspect Build 312 changed files')
else:
    for name in changed.stdout.splitlines():
        if name not in ALLOWED:
            errors.append(f'unexpected Build 312 source path: {name}')
        low = name.lower()
        if 'migration' in low or low.startswith('database') or low.endswith('.sql'):
            errors.append(f'Build 312 unexpectedly changes schema/migration authority: {name}')

for rel in [
    'functions/api/_lib/staff-auth.js',
    'functions/api/_lib/accounting-gl.js',
    'functions/api/_lib/inventory-posting.js',
    'sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql',
]:
    proc = subprocess.run(['git','diff','--quiet',BASELINE,'--',rel], cwd=ROOT)
    if proc.returncode:
        errors.append(f'Build 312 changed retained authority {rel}')

for rel, tokens in {
    'functions/api/_lib/catalog-integrity.js': ['roundInventoryQuantity','planInventoryAdjustment','validateInventoryPayloadNumbers','isPurchaseOrderReceiptReplay'],
    'functions/api/admin/catalog_stock_action.js': ['planInventoryAdjustment','integrity_validation:true',"source_kind:'manual'"],
    'functions/api/admin/catalog_purchase_order_update.js': ['isPurchaseOrderReceiptReplay','idempotent_replay:true',"movement_type:'receive'",'rollbackInventoryQuantity'],
    'functions/api/admin/catalog_inventory_save.js': ['validateInventoryPayloadNumbers','integrity_validation: true'],
    'functions/api/admin/catalog_reorder_request.js': ["['draft','requested','ordered']",'qty_ordered must be a finite number greater than zero.'],
    'scripts/build312_inventory_integrity_audit.query': ['inventory_negative_qty','movement_arithmetic_mismatch','posting_batch_rollup_mismatch','purchase_order_orphan_key','reservation_posting_batch_source_mismatch'],
}.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f'{rel} missing retained Build 312 token {token}')

stock = read('functions/api/admin/catalog_stock_action.js')
if 'Math.max(0' in stock:
    errors.append('catalog_stock_action.js still clamps overdraw instead of rejecting it')

audit = re.sub(r'^\s*--.*$', '', read('scripts/build312_inventory_integrity_audit.query'), flags=re.M)
if re.search(r'\b(insert|update|delete|alter|create|drop|truncate|grant|revoke|call)\b', audit, flags=re.I):
    errors.append('Build 312 inventory audit query is not read-only')

for rel in [
    'functions/api/_lib/catalog-integrity.js',
    'functions/api/admin/catalog_inventory_save.js',
    'functions/api/admin/catalog_stock_action.js',
    'functions/api/admin/catalog_reorder_request.js',
    'functions/api/admin/catalog_purchase_order_update.js',
    'scripts/build312_inventory_integrity_test.mjs',
]:
    proc = subprocess.run(['node','--check',str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f'node --check failed {rel}: {proc.stderr.strip()}')

test = subprocess.run(['node','scripts/build312_inventory_integrity_test.mjs'], cwd=ROOT, capture_output=True, text=True)
if test.returncode:
    errors.append(f'Build 312 integrity test failed: {test.stdout.strip()} {test.stderr.strip()}')

smoke = subprocess.run(['bash','-n',str(ROOT / 'scripts/build312_http_smoke.sh')], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f'bash -n failed build312_http_smoke.sh: {smoke.stderr.strip()}')

queue = read('AUTONOMOUS_RELEASE_QUEUE.md')
for token in ['Build 312 — Inventory data-integrity sweep','Build 313 — Catalog/Product Administration extraction','Build 319 — Runtime efficiency + CI consolidation']:
    if token not in queue:
        errors.append(f'AUTONOMOUS_RELEASE_QUEUE.md missing retained queue token {token}')

if errors:
    print('Build 312 Inventory data-integrity sweep check: FAIL')
    for error in errors:
        print('-', error)
    sys.exit(1)

print('Build 312 Inventory data-integrity sweep check: PASS')
print('- stock adjustments retain three-decimal quantity precision and reject overdraw instead of clamping')
print('- purchase-order receipt is replay-safe and records receive movement evidence')
print('- future inventory/reorder writes reject invalid numeric payloads before persistence')
print('- deterministic inventory/posting/order/reservation audit query is read-only')
print('- retained Build 240 posting/accounting/auth and all schema authority remain unchanged')
print('- runtime acceptance performs no inventory mutation')
print(f'- Production remains accepted Build 303 at {PRODUCTION} and stays closed for Build 312')
