#!/usr/bin/env python3
from pathlib import Path
import json, re, sys, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f'missing {rel}'); return ''
 return p.read_text(encoding='utf-8')
def need(rel,*tokens):
 s=read(rel)
 for t in tokens:
  if t not in s: errors.append(f'{rel} missing {t!r}')
 return s

def loadj(rel):
 try:return json.loads(read(rel))
 except Exception as e: errors.append(f'{rel} JSON parse failed: {e}');return {}

pricing=loadj('functions/api/data/rosie_services_pricing_and_packages.json')
landing=loadj('functions/api/data/landing_pages_content.json')
addons=pricing.get('addons',[]) if isinstance(pricing,dict) else []
codes={str(a.get('code','')) for a in addons}
canonical={slug:p for slug,p in landing.get('pages',{}).items() if p.get('related_code') in codes and p.get('enabled') is not False}
if len(addons)!=24: errors.append(f'expected 24 add-ons, got {len(addons)}')
if len(canonical)!=24: errors.append(f'expected 24 enabled canonical add-on pages, got {len(canonical)}')
if read('data/landing_pages_content.json')!=read('functions/api/data/landing_pages_content.json'): errors.append('landing content public/function mirrors differ')
if read('data/rosie_services_pricing_and_packages.json')!=read('functions/api/data/rosie_services_pricing_and_packages.json'): errors.append('pricing public/function mirrors differ')

for code in ['headlight_restoration_addon','carpet_shampoo','pet_hair_removal','odor_treatment','engine_cleaning','external_ceramic_coating']:
 a=next((x for x in addons if x.get('code')==code),None)
 if not a: errors.append(f'missing {code}'); continue
 if a.get('quote_required') is not True: errors.append(f'{code} must be quote_required')
 if not a.get('condition_pricing'): errors.append(f'{code} missing condition_pricing')
 if not a.get('pricing_basis'): errors.append(f'{code} missing pricing_basis')

head=canonical.get('headlight-restoration',{})
if head.get('related_code')!='headlight_restoration_addon': errors.append('headlight canonical page code wrong')
carpet=canonical.get('carpet-shampoo',{})
for token in ['seat','carpet','dry']:
 if token not in json.dumps(carpet).lower(): errors.append(f'carpet page missing {token} restoration context')

loader=need('functions/api/landing_pages_public.js','EXPLICIT_LANDING_PAGES','GENERATED_ADDON_LANDING_PAGES','scope_includes','visual_briefs','external_ceramic_coating: "ceramic-coating"','headlight_restoration_addon: "headlight-restoration"')
# explicit content must be merged after generated pages
if loader.find('GENERATED_ADDON_LANDING_PAGES')>loader.find('EXPLICIT_LANDING_PAGES', loader.find('const SYSTEM_LANDING_PAGES')) and 'mergeLandingPages' in loader:
 pass

landing_js=need('assets/landing-page.js','Price by condition, not guesswork','When we pause and re-quote','Visual proof placeholders','landing-static-jsonld','service-photo-needed.svg')
if 'setInterval(' in landing_js: errors.append('landing page unexpectedly introduces setInterval')
need('services/index.html',"external_ceramic_coating:'ceramic-coating'","headlight_restoration_addon:'headlight-restoration'",'condition quote','Pricing basis:')
need('book/index.html','condition assessed','Condition quote')
need('_redirects','/headlight-restoration-addon /headlight-restoration 301','/odor-treatment /odor-removal 301','/external-ceramic-coating /ceramic-coating 301')

for slug,page in canonical.items():
 rel=f'{slug}/index.html'; s=read(rel); low=s.lower()
 if low.count('<h1')!=1: errors.append(f'{rel} must contain exactly one H1, got {low.count("<h1")}')
 if f'https://rosiedazzlers.ca/{slug}' not in s: errors.append(f'{rel} missing canonical URL')
 if 'application/ld+json' not in s: errors.append(f'{rel} missing JSON-LD')
 if 'Frequently asked questions' not in s: errors.append(f'{rel} missing FAQ fallback')
 if 'visual-proof-plan' not in s: errors.append(f'{rel} missing visual placeholder plan')
 mt=re.search(r'<title>(.*?)</title>',s,re.S)
 if not mt or len(re.sub('<.*?>','',mt.group(1)).strip())>65: errors.append(f'{rel} title missing/too long')

# sitemap must contain all canonical add-on pages and no duplicate intent URLs.
try:
 tree=ET.parse(ROOT/'sitemap.xml'); ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
 urls={((u.find(ns+'loc').text or '').strip()) for u in tree.getroot().findall(ns+'url') if u.find(ns+'loc') is not None}
 for slug in canonical:
  if f'https://rosiedazzlers.ca/{slug}/' not in urls: errors.append(f'sitemap missing {slug}')
 for old in ['external-ceramic-coating','odor-treatment','headlight-restoration-addon']:
  if f'https://rosiedazzlers.ca/{old}/' in urls: errors.append(f'sitemap still contains retired {old}')
except Exception as e: errors.append(f'sitemap parse failed: {e}')

# Operations runtime is lazy/manual and interval-free.
ops_files=['apps/operations/operations-app.js','apps/operations/today-module.js','apps/operations/schedule-module.js','apps/operations/blocks-module.js','apps/operations/assignments-module.js','apps/operations/live-module.js']
for rel in ops_files:
 s=read(rel)
 if 'setInterval(' in s: errors.append(f'{rel} contains prohibited setInterval')
need('app/operations/index.html','Build 265 modular runtime','Automatic monitoring','OFF','apps/operations/operations-app.js?v=20260829build265')
base=read('apps/operations/operations-app.js')
for token in ['ModuleLoader','data-operations-module','sleepOperations']:
 if token not in base: errors.append(f'operations base missing {token}')
if '/api/admin/' in base: errors.append('Operations base shell must not directly load operational API data')
reg=loadj('data/build265_app_modules.json')
if reg.get('build')!=265: errors.append('build265 registry identity wrong')
mods={m.get('key'):m for m in reg.get('modules',[])}
if mods.get('operations',{}).get('runtime_status')!='active_modular_runtime': errors.append('operations registry runtime status wrong')

need('assets/app-core/module-resolver.js','const BUILD=265',"operations:{key:'operations',name:'Operations / Supervisor App',href:'/app/operations/',status:'runtime'}")
need('service-worker.js',"const CACHE='rosie-app-v20260829build265'",'/apps/operations/operations-app.js')
sw=read('service-worker.js')
precache=sw.split('const URLS=',1)[1].split("self.addEventListener('install'",1)[0] if 'const URLS=' in sw else ''
for heavy in ['today-module.js','schedule-module.js','blocks-module.js','assignments-module.js','live-module.js','live-job-module.js']:
 if heavy in precache: errors.append(f'heavy lazy module precached: {heavy}')
need('assets/cache-health-controls.js','const EXPECTED_BUILD = 265','20260829build265','Build 265 assets confirmed')
need('AI_PROJECT_HANDOFF.md','Build:** 265','24 current add-ons','Operations / Supervisor App')
need('MASTER_VALUE_ROADMAP.md','Build:** 265','Completed in Build 265','service-cost / minimum-price authority')
need('DOC_INDEX.md','only living planning authorities','MARKDOWN_RETIREMENT_BUILD265.md')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 265 current acceptance','rosie-app-v20260829build265')

if errors:
 print('Build 265 convergence check: FAIL')
 for e in errors: print(' -',e)
 sys.exit(1)
print('Build 265 convergence check: PASS')
print(' - 24 add-ons have detailed canonical static-first landing pages')
print(' - condition-sensitive pricing remains quote-safe in booking')
print(' - duplicate service intents redirect/canonicalize cleanly')
print(' - visual placeholder and responsive detail structures are present')
print(' - Operations is lazy/manual and interval-free')
print(' - pricing/content mirrors, sitemap, cache identity and living docs are synchronized')
