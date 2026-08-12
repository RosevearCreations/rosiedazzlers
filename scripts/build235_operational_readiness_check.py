from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
def need(path,text):
 p=root/path
 if not p.exists(): errors.append(f"missing {path}"); return
 s=p.read_text(errors="ignore")
 if text not in s: errors.append(f"{path}: missing {text}")
need("admin-inventory-manager.html","JSON table editor")
need("admin-inventory-manager.html","gallery_image_urls")
need("admin-launch-readiness.html","Manual preflight confirmations")
need("admin-catalog.html","Product gallery — up to 7 images")
need("functions/api/admin/catalog_inventory_save.js","normalizeGalleryImages")
need("functions/api/catalog_public.js","gallery_image_urls")
need("SUPABASE_SCHEMA.sql","Build 235: ordered product/inventory gallery support")
need("sql/2026-07-19_build235_inventory_json_gallery_launch_readiness.sql","jsonb_array_length(gallery_image_urls)<=7")
for html in ["admin-inventory-manager.html","admin-launch-readiness.html","admin-catalog.html"]:
 s=(root/html).read_text(errors="ignore")
 if len(re.findall(r"<h1(?:\s|>)",s,re.I))!=1: errors.append(f"{html}: expected exactly one H1")
 route=root/html.replace(".html","")/"index.html"
 if not route.exists() or route.read_bytes()!=(root/html).read_bytes(): errors.append(f"{html}: route copy mismatch")
if errors:
 print("Build 235 check FAILED")
 for e in errors: print("-",e)
 sys.exit(1)
print("Build 235 check passed")
