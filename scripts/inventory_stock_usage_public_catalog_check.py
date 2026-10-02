#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

page=read("admin-inventory-manager.html")
copy=read("admin-inventory-manager/index.html")
save=read("functions/api/admin/catalog_inventory_save.js")
integrity=read("functions/api/_lib/catalog-integrity.js")
public_api=read("functions/api/catalog_public.js")
chrome=read("assets/chrome.js")
hub=read("tools-supplies/index.html")
hub_file=read("tools-supplies.html")
gear=read("gear/index.html")
consumables=read("consumables/index.html")
migration=read("sql/2026-10-02_inventory_stock_usage_units.sql")

if page!=copy:
    errors.append("admin-inventory-manager route copies diverged")
if hub!=hub_file:
    errors.append("tools-supplies route copies diverged")

require(page,[
    'id="viewMode"','<option value="cards">Cards</option>','class="card-main-image"','class="table-main-image"','function mainImageCell(x)',
    'data-f="stock_unit"','data-f="usage_unit"','data-f="usage_units_per_stock_unit"',
    'function primaryImage(item)','function costPerUsage(item)',
    "out.image_url=out.gallery_image_urls[0]",
    'Cost / usage','stockUnitOptions','usageUnitOptions'
],"inventory manager")
require(save,[
    "stock_unit: String(body?.stock_unit || body?.unit_label ||",
    'Object.prototype.hasOwnProperty.call(body || {}, "usage_unit")',
    'Object.prototype.hasOwnProperty.call(body || {}, "usage_units_per_stock_unit")',
    "payload.usage_unit = String(body?.usage_unit ||",
    "payload.usage_units_per_stock_unit =",
    "usage_units_per_stock_unit must be greater than zero"
],"inventory save API")
require(integrity,["['usage_units_per_stock_unit', 'usage_units_per_stock_unit']"],"inventory numeric integrity")
require(public_api,["stock_unit,usage_unit,usage_units_per_stock_unit"],"public catalog API")
require(chrome,[ '["/tools-supplies", "Tools & Supplies"]', 'href === "/tools-supplies"' ],"public navigation")
require(hub,["Tools &amp; supplies we use",'href="/gear"','href="/consumables"'],"public tools/supplies hub")
require(gear,["gallery.find(Boolean)"],"gear image continuity")
require(consumables,["gallery.find(Boolean)"],"consumables image continuity")
require(migration,[
    "add column if not exists stock_unit text",
    "add column if not exists usage_unit text",
    "add column if not exists usage_units_per_stock_unit",
    "catalog_inventory_items_usage_units_positive"
],"inventory stock/usage migration")

if errors:
    print("INVENTORY STOCK / USAGE & PUBLIC CATALOG: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)
print("INVENTORY STOCK / USAGE & PUBLIC CATALOG: PASS")
