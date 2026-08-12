from pathlib import Path
r=Path(__file__).resolve().parents[1]
checks={"UI":(r/"admin-catalog.html","supplierLinkPreviewBtn"),"endpoint":(r/"functions/api/admin/catalog_supplier_link_preview.js","findDuplicate"),"migration":(r/"sql/2026-07-16_build233_supplier_link_inventory_import.sql","catalog_supplier_import_audit"),"docs":(r/"docs/SUPPLIER_LINK_INVENTORY_IMPORT.md","Safety boundaries")}
for n,(p,t) in checks.items():
 assert p.exists() and t in p.read_text(),f"{n} missing"
print("Build 233 supplier-link inventory check passed.")
