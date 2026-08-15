from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def text(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f'missing {rel}'); return ''
 return p.read_text(encoding='utf-8',errors='ignore')
def need(rel,*tokens):
 s=text(rel)
 for token in tokens:
  if token not in s: errors.append(f'{rel} missing {token}')
 return s

# Photo Studio comprehensive explicit targets, with historical Build253 identity intact.
try:
 reg=json.loads(text('data/build253_photo_targets.json')); targets=reg.get('targets',[]); keys={t.get('target_key') for t in targets}
 if reg.get('build')!=253 or reg.get('revision')!=256 or int(reg.get('current_build') or 0)!=259:
  errors.append('photo target registry identity/current build mismatch')
 required=['site:brand:logo','site:brand:banner','site:brand:reviews','site:brand:background','maintenance:hero','page-background:/pricing','page-background:/services','site-asset:/assets/brand/rosie-reviews-fallback.png','site-asset:/assets/vehicles/outline_front.svg']
 for k in required:
  if k not in keys: errors.append(f'photo target missing {k}')
 if len(targets)<600: errors.append(f'photo target coverage unexpectedly low: {len(targets)}')
 heroes=[t for t in targets if t.get('target_type')=='landing_hero']; pairs=[t for t in targets if t.get('target_type')=='before_after_pair']
 if len(pairs)!=len(heroes)*6: errors.append('every landing hero must retain three complete before/after pairs')
except Exception as exc: errors.append(f'photo target registry invalid: {exc}')

website=need('assets/website-images.js','hydrateGlobalSiteImageOverrides','site:brand:background','page-background:','explicitAssetTargetForImage','startsWith(\'/admin\')')
if website!=text('functions/api/assets/website-images.js'): errors.append('website-images Functions mirror drifted')
chrome=need('assets/chrome.js','website-images.js?v=20260813build259','hydrateGlobalSiteImageOverrides')
if chrome!=text('functions/api/assets/chrome.js'): errors.append('chrome Functions mirror drifted')
studio=need('admin-photo-studio.html','Site logo / banners / reviews / default background','Shared website images / charts','Optional page backgrounds','Maintenance-plan images','Delete unassigned image from library + R2')
if studio!=text('admin-photo-studio/index.html'): errors.append('Photo Studio clean-route copy drifted')

# Add-on detail and full owner-editable landing content.
services=need('services.html','Estimated added time:','View process &amp; details','addonDetailHref','uv_protectant_applied_on_interior_panels', 'site.css?v=20260813build259','pricing-catalog-client.js?v=20260813build259')
# Internal code must only be used as implementation/data, never rendered as the customer subtitle.
if '${escapeHtml(addon.code)}' in services: errors.append('Services still renders raw add-on code')
need('assets/pricing-catalog-client.js','splitHeaderLabel','headerHeight','duration_label')
need('admin-app.html','Estimated time addition','duration_label')
landing_api=need('functions/api/landing_pages_public.js','landing_pages_content','flattenEditableLandingPages')
landing_ui=need('admin-site-settings.html','Complete landing-page editor','Things to know','Related products','Official links','FAQ')
if landing_ui!=text('admin-site-settings/index.html'): errors.append('admin-site-settings clean-route copy drifted')
landing_js=need('assets/landing-page.js','website-images.js?v=20260813build259','reasons_page_exists','process','equipment','highlights','things_to_know','related_products','official_links')
content=json.loads(text('data/landing_pages_content.json') or '{}')
allpages={}
for section in [content.get('default_pages',{}).get('pages',{}),content.get('expansion_pages',{}).get('pages',{}),content.get('pages',{})]:
 for slug,page in (section or {}).items(): allpages[slug]={**allpages.get(slug,{}),**(page or {})}
cat=json.loads(text('data/rosie_services_pricing_and_packages.json') or '{}')
slug_map={'full_clay_treatment':'full-clay-treatment','two_stage_polish':'two-stage-polish','high_grade_paint_sealant':'high-grade-paint-sealant','uv_protectant_applied_on_interior_panels':'uv-protectant','de_ionizing_treatment':'de-ionizing-treatment','de_badging':'de-badging','engine_cleaning':'engine-cleaning','external_ceramic_coating':'external-ceramic-coating','external_graphene_fine_finish':'graphene-finish','external_wax':'exterior-wax','vinyl_wrapping':'vinyl-wrapping','window_tinting':'window-tinting'}
for a in cat.get('addons',[]):
 slug=slug_map.get(a.get('code'),str(a.get('code','')).replace('_','-'))
 if slug not in allpages: errors.append(f'owner-editable add-on landing content missing {slug}')
 if not (ROOT/slug/'index.html').exists(): errors.append(f'add-on route shell missing {slug}')
paint=allpages.get('paint-correction',{})
paint_blob=json.dumps(paint).lower()
for token in ['test','clear coat','multi-stage','cost']:
 if token not in paint_blob: errors.append(f'paint correction detail missing {token}')
if text('data/landing_pages_content.json')!=text('functions/api/data/landing_pages_content.json'): errors.append('landing page bundled/API data drifted')

# Maintenance/Fleet/Services responsive repairs.
maintenance=need('maintenance-plan.html','data-photo-image-target="maintenance:hero"','waitlist','membership','website-images.js?v=20260813build259','box-sizing:border-box')
if maintenance!=text('maintenance-plan/index.html'): errors.append('maintenance-plan clean-route copy drifted')
need('assets/growth-settings.js','waitlist_intro','good_fit_lines','self_serve_title')
need('functions/api/growth_settings_public.js','waitlist_intro','good_fit_lines','self_serve_title')
need('fleet.html','box-sizing:border-box','max-width:100%','min-width:0')
if text('fleet.html')!=text('fleet/index.html'): errors.append('fleet clean-route copy drifted')
need('services.html','.addon-card-meta','.addon-card-actions','.decision-card','overflow:hidden')

# Vehicle-size review: secure customer response is a real persisted workflow.
sql=need('sql/2026-08-13_build259_vehicle_size_review.sql','vehicle_size_review_status','vehicle_size_review_token_hash','vehicle_size_reviewed_price_cents','bookings_vehicle_size_review_status_idx')
if sql!=text('2026-08-13_build259_vehicle_size_review.sql'): errors.append('Build259 migration root/sql copies drifted')
need('SUPABASE_SCHEMA.sql','vehicle_size_review_status text not null default','BEGIN 2026-08-13_build259_vehicle_size_review.sql')
need('book.html','vehicleSizeVerificationState','needs_review','secure link to confirm the updated size/price or cancel','vehicle_size_review_status')
if text('book.html')!=text('book/index.html'): errors.append('book clean-route copy drifted')
need('functions/api/checkout.js','vehicle_size_review_status','vehicle_size_catalog_expected','OPTIONAL_BOOKING_INTAKE_FIELDS')
need('functions/api/admin/booking_vehicle_size_review.js','crypto.getRandomValues','sha256Hex','awaiting_customer','dispatchNotificationThroughProvider','7*86400000')
need('functions/api/booking_vehicle_size_review.js','constantTimeEqual','customer_confirmed','customer_cancelled','vehicle_size_review_token_hash')
need('admin-booking.html','Vehicle size verification','Verify as reviewed','Send correction for customer confirmation')
if text('admin-booking.html')!=text('admin-booking/index.html'): errors.append('admin-booking clean-route copy drifted')
need('vehicle-size-review.html','noindex,nofollow','Confirm updated size and price','Cancel booking')
if text('vehicle-size-review.html')!=text('vehicle-size-review/index.html'): errors.append('vehicle-size-review clean-route copy drifted')

# Quote Pipeline is selectable/editable and preserves relational IDs.
need('functions/api/admin/quote_pipeline_list.js','quote_pipeline_items','limit=250')
need('functions/api/admin/quote_pipeline_save.js','quote_pipeline_items','customer_id','Object.prototype.hasOwnProperty.call','return=representation')
quotes=need('admin-quotes.html','Build 259 · editable pipeline','quote-row.selected','qCustomerId','Save quote','New quote')
if quotes!=text('admin-quotes/index.html'): errors.append('admin-quotes clean-route copy drifted')

# Cache/resource boundaries and SEO.
need('service-worker.js','rosie-app-v20260813build259','rosie-app-v20260813build258','rosie-app-v20260813build257')
public_lib=need('functions/api/_lib/public-website-images.js','r2_scan_per_request:false')
if 'listApprovedR2Images' in public_lib: errors.append('Build257 rule regressed: public manifest scans R2')
admin_list=need('functions/api/admin/photo_library_list.js','r2_scan_per_load:false')
if 'listApprovedR2Images' in admin_list: errors.append('Build257 rule regressed: ordinary Photo Studio load scans R2')
need('sitemap.xml','/seat-shampoo/','/uv-protectant/','/two-stage-polish/')
need('BUILD259_SUMMARY.md','Build 259 — Editable Media','Build 259 vehicle-size review migration')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 259')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 259')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 259 acceptance')
md=list(ROOT.rglob('*.md'))
missing=[str(p.relative_to(ROOT)) for p in md if 'BUILD259_SYNC:' not in p.read_text(encoding='utf-8',errors='ignore')]
if missing: errors.append(f'{len(missing)} Markdown files missing BUILD259_SYNC marker; first {missing[:5]}')

if errors:
 print('Build 259 editable media/services/ops check FAILED')
 for e in errors: print('-',e)
 sys.exit(1)
print(f'Build 259 editable media/services/ops check passed ({len(md)} Markdown files synchronized).')
