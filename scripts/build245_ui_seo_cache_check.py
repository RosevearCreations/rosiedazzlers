#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import json,re,sys
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def req(path:str):
    p=ROOT/path
    if not p.exists(): errors.append(f'missing {path}')
    return p

for path in ['admin-ui-health.html','admin-ui-health/index.html','assets/ui-health-scanner.js','assets/cache-health-controls.js','data/build245_ui_health_routes.json','BUILD245_SUMMARY.md','sql/2026-08-06_build245_ui_seo_cache_acceptance_no_ddl.sql']:
    req(path)
if (ROOT/'admin-ui-health.html').exists() and (ROOT/'admin-ui-health/index.html').exists():
    if (ROOT/'admin-ui-health.html').read_text()!= (ROOT/'admin-ui-health/index.html').read_text(): errors.append('admin-ui-health route copies differ')

# Static public SEO and one-H1 checks.
for p in ROOT.rglob('*.html'):
    rel=p.relative_to(ROOT).as_posix()
    if rel.startswith(('functions/','docs/')): continue
    soup=BeautifulSoup(p.read_text(errors='ignore'),'html.parser')
    h1=len(soup.find_all('h1'))
    if h1!=1: errors.append(f'{rel}: expected one H1, found {h1}')
    robots=(soup.find('meta',attrs={'name':'robots'}) or {}).get('content','') if soup.find('meta',attrs={'name':'robots'}) else ''
    is_admin=rel.startswith('admin') or '/admin' in rel
    if is_admin and 'noindex' not in robots.lower(): errors.append(f'{rel}: admin page missing noindex')
    if not is_admin and 'noindex' not in robots.lower():
        title=soup.title.get_text(strip=True) if soup.title else ''
        desc=soup.find('meta',attrs={'name':'description'})
        desc=desc.get('content','').strip() if desc else ''
        can=soup.find('link',rel='canonical')
        if not title or len(title)>65: errors.append(f'{rel}: title missing/too long ({len(title)})')
        if not desc or len(desc)>165: errors.append(f'{rel}: description missing/too long ({len(desc)})')
        if not can or not can.get('href'): errors.append(f'{rel}: missing canonical')

# No deprecated SVG photo fallbacks.
pattern=re.compile(r'rosie-reviews-fallback\.svg|generic_addon\.svg|de_ionizing_treatment\.svg|de_badging\.svg|engine_cleaning\.svg|external_ceramic_coating\.svg|external_graphene_fine_finish\.svg|external_wax\.svg|vinyl_wrapping\.svg|window_tinting\.svg',re.I)
for p in ROOT.rglob('*'):
    if p.is_file() and p.suffix.lower() in {'.html','.js','.json','.md','.css'}:
        text=p.read_text(errors='ignore')
        if pattern.search(text): errors.append(f'{p.relative_to(ROOT)}: deprecated SVG photo fallback')

# New photo assets exist.
for path in ['assets/brand/rosie-reviews-fallback.png','assets/addons/generic_addon.png','assets/placeholders/service-photo.jpg','assets/placeholders/local-proof-photo.jpg','assets/placeholders/product-gallery-photo.jpg','assets/placeholders/inventory-tools-photo.jpg','assets/placeholders/workflow-photo.jpg','assets/placeholders/launch-readiness-photo.jpg']:
    req(path)

# Service worker cache safety.
sw=req('service-worker.js')
if sw.exists():
    text=sw.read_text()
    for marker in ["rosie-app-v20260807build245",'Promise.allSettled(URLS.map','event.request.mode===\'navigate\'','status:503']:
        if marker not in text: errors.append(f'service-worker missing {marker}')
    if "'\"/\"'" in text or 'cache.addAll(URLS)' in text: errors.append('service-worker retained malformed/all-or-nothing cache install')

# Startup cache controls and scanner integration.
startup=req('admin-startup-guide.html')
if startup.exists():
    text=startup.read_text()
    for marker in ['id="ui-health"','/admin-ui-health.html','cache-health-controls.js?v=20260807build245','data-build245']:
        if marker not in text: errors.append(f'startup guide missing {marker}')

# Route matrix JSON valid.
routes=req('data/build245_ui_health_routes.json')
if routes.exists():
    data=json.loads(routes.read_text())
    if data.get('build')!=245: errors.append('route matrix build is not 245')
    paths={row.get('path') for row in data.get('routes',[])}
    for route in ['/','/book','/pricing','/services','/admin-startup-guide.html','/admin-ui-health.html','/uv-protectant','/engine-cleaning']:
        if route not in paths: errors.append(f'route matrix missing {route}')

if errors:
    print('Build 245 check failed:')
    for e in errors: print('-',e)
    sys.exit(1)
print('Build 245 UI/SEO/cache check passed.')
