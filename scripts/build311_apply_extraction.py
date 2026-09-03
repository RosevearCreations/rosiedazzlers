from pathlib import Path

PAGE = Path("admin-catalog.html")
ASSET = Path("assets/admin-catalog-v311.js")
START = '<script>\n(function(){'
END = '</script>\n<script src="/assets/chrome.js"></script>'
EXTERNAL = '<script src="/assets/admin-catalog-v311.js"></script>'

text = PAGE.read_text(encoding="utf-8")

if EXTERNAL in text:
    if not ASSET.exists():
        raise SystemExit("Build 311 extraction is referenced but the runtime asset is missing")
    print("Build 311 extraction is already applied")
    raise SystemExit(0)

if text.count(START) != 1:
    raise SystemExit(f"Expected exactly one canonical Inventory inline runtime start, found {text.count(START)}")
if text.count(END) != 1:
    raise SystemExit(f"Expected exactly one canonical Inventory inline runtime end, found {text.count(END)}")

start = text.index(START)
end = text.index(END, start)
script_close = end + len('</script>')
script_block = text[start:script_close]
inner = script_block[len('<script>\n'):-len('</script>')]

if not inner.startswith('(function(){\n'):
    raise SystemExit("Inventory runtime no longer begins with the accepted IIFE")
if not inner.rstrip().endswith('})();'):
    raise SystemExit("Inventory runtime no longer ends with the accepted IIFE")

ASSET.write_text(inner, encoding="utf-8")
updated = text[:start] + EXTERNAL + text[script_close:]
PAGE.write_text(updated, encoding="utf-8")

reconstructed = updated.replace(EXTERNAL, '<script>\n' + ASSET.read_text(encoding="utf-8") + '</script>', 1)
if reconstructed != text:
    raise SystemExit("Build 311 reconstruction check failed; refusing a non-structural extraction")

print(f"Extracted {len(inner.encode('utf-8'))} bytes from admin-catalog.html into {ASSET}")
print("Exact reconstruction succeeded")
