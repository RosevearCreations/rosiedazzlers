// Historical Build 259 cache guard: rosie-app-v20260813build259
// Historical Build 247 fallback token: /data/build247_go_live_blockers.json
// Historical Build 256 cache token: rosie-app-v20260812build256
// Build 257 resource-limit hotfix: database-first photo loads; bounded R2 sync.
// Historical Build 250 cache guard: rosie-app-v20260810build250
// Historical Build 251 cache guard: rosie-app-v20260811build251 (Gate C readability release marker retained in docs)
// Historical Build 249 cache guard: rosie-app-v20260810build249 /data/build249_inventory_recovery.json
// Historical Build 248 cache guard: rosie-app-v20260809build248
// Historical Build 246 cache guard: rosie-app-v20260807build246 /data/build246_ui_health_routes.json
// Historical Build 245 guard: rosie-app-v20260807build245 /assets/cache-health-controls.js?v=20260807build245 /assets/ui-health-scanner.js?v=20260807build245
// Historical exact cache guard tokens: rosie-app-v20260805build241 /assets/startup-command-center.js?v=20260805build241
// Historical Build 240 cache evidence: rosie-app-v20260805build240
// Build 241 service-worker cache hotfix refreshes the unified Startup Command Center script and preserves Build 240 inventory posting/reversal.
// Build 238 service-worker cache: CSS recovery, Startup Guide, transactional inventory, current roadmap, launch evidence and operational readiness.
// Historical Build 238 guard: rosie-app-v20260730build238 /data/build238_go_live_blockers.json /data/build238_next_steps.json
// Historical Build 252 cache guard: rosie-app-v20260812build252
// Historical Build 253 cache guard: rosie-app-v20260812build253
// Historical Build 254 cache guard: rosie-app-v20260812build254
// Build 255 click-to-edit Photo Studio editor
// Historical cache: rosie-app-v20260812build255
// Historical Build 257 cache guard: rosie-app-v20260813build257
// Historical Build 258 cache guard: rosie-app-v20260813build258
// Build 260 stabilization: current startup/UI/media-health assets are cache coherent.
// Build 261 reliability: static 5xx cache fallback + admin analytics isolation.
// Build 262 CPU stabilization: self-diagnostics, bounded analytics, manual admin refresh, coherent cache identity.
const CACHE='rosie-app-v20260820build262';
const URLS=['/admin-photo-studio.html','/admin-media-health.html','/data/build253_photo_targets.json','/data/build249_inventory_recovery.json',
  '/admin-daip-media.html',
  '/data/build260_go_live_blockers.json',
  '/data/build247_next_steps.json',
  '/data/build247_following_steps.json',
  '/data/build246_next_steps.json',
  '/data/build246_completed_steps.json',
  '/admin-catalog.html',
  '/data/build262_ui_health_routes.json',
  '/assets/cache-health-controls.js',
  '/assets/cache-health-controls.js?v=20260820build262',
  '/assets/ui-health-scanner.js',
  '/assets/ui-health-scanner.js?v=20260820build262',
  '/admin-ui-health.html',
  '/admin-runtime-health.html',
  '/assets/runtime-health.js?v=20260820build262',
  '/assets/brand/rosie-reviews-fallback.png',
  '/assets/addons/generic_addon.png',
  '/assets/addons/de_ionizing_treatment.png',
  '/assets/addons/de_badging.png',
  '/assets/addons/engine_cleaning.png',
  '/assets/addons/external_ceramic_coating.png',
  '/assets/addons/external_graphene_fine_finish.png',
  '/assets/addons/external_wax.png',
  '/assets/addons/vinyl_wrapping.png',
  '/assets/addons/window_tinting.png',
  '/assets/placeholders/service-photo.jpg',
  '/assets/placeholders/local-proof-photo.jpg',
  '/assets/placeholders/product-gallery-photo.jpg',
  '/assets/placeholders/inventory-tools-photo.jpg',
  '/assets/placeholders/workflow-photo.jpg',
  '/assets/placeholders/launch-readiness-photo.jpg',
  '/assets/startup-command-center.js?v=20260820build262',
  '/admin-inventory-posting.html',
  '/data/build240_go_live_blockers.json',
  '/data/build240_next_steps.json',
  '/admin-startup-guide.html',
  '/assets/startup-command-center.js',
  '/data/build239_go_live_blockers.json',
  '/admin-launch-readiness.html',
  '/admin-production.html',
  '/admin-test-centre.html',
  '/admin-roadmap-execution.html',
  '/data/build238_go_live_blockers.json',
  '/data/build238_next_steps.json',
  '/assets/styles.css',
  '/assets/admin.css',
  '/assets/style.css',
  '/admin-blocks.html',
  '/admin-inventory-manager.html',
  '/admin-content.html',
  '/',
  '/book',
  '/pricing',
  '/services',
  '/login',
  '/assets/site.css',
  '/manifest.webmanifest',
  '/assets/chrome.js',
  '/assets/public-analytics.js',
  '/assets/admin-auth.js',
  '/assets/admin-menu.js',
  '/assets/admin-shell.js',
  '/assets/site.js',
  '/assets/marketing-consent.js',
  '/assets/visual-placeholders.js',
  '/assets/media-source-resolver.js',
  '/assets/website-images.js',
  '/data/responsive_visual_registry.json',
  '/data/visual_placeholder_registry.json',
  '/data/workflow_connection_build208.json',
  '/data/build210_connected_live_workflow.json',
  '/data/build211_production_reliability.json',
  '/data/production_reliability_registry.json',
  '/data/production_test_playbook_build212.json',
  '/data/build212_guided_production_testing.json',
  '/data/build213_owner_action_customer_trust.json',
  '/data/build214_security_task_orchestration.json',
  '/data/security_posture_registry.json',
  '/detailer-jobs.html',
  '/admin-progress.html',
  '/progress.html',
  '/final-balance-payment.html',
  '/admin-workflow.html',
  '/admin-today.html',
  '/admin-gallery.html',
  '/admin-customers.html',
  '/admin-security.html',
  '/admin-daip.html',
  '/admin-daip-governance.html',
  '/admin-daip-readiness.html',
  '/admin-daip-design.html',
  '/admin-daip-gate-c.html',
  '/admin-integrations.html',
  '/admin-daip-intake-dry-run.html',
  '/admin-creative-projects.html',
  '/data/build216_media_reliability_daip_governance.json',
  '/data/build217_secure_final_balance_links.json',
  '/data/build218_daip_test_mode_foundation.json',
  '/data/build219_daip_governance_workspace.json',
  '/data/build220_customer_access_management.json',
  '/data/build221_customer_admin_route_hotfix.json',
  '/data/build222_daip_phase1_readiness_design_review.json',
  '/data/build223_daip_private_mvp_design_blueprint.json',
  '/data/build224_daip_gate_c_technical_review_rollback.json',
  '/data/build225_social_analytics_connection_centre.json',
  '/data/build226_daip_intake_dry_run.json',
  '/data/build228_creative_project_intelligence.json',
  '/data/build229_standard_job_project_choice.json',
  '/data/build230_project_costs_templates_outputs.json',
  '/data/build231_project_profitability_content_planning.json'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(URLS.map(async(url)=>{try{const response=await fetch(url,{cache:'reload'});if(response.ok)await cache.put(url,response.clone());}catch{}}));await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    const url=new URL(event.request.url);
    const sameOrigin=url.origin===self.location.origin;
    const isApi=sameOrigin&&url.pathname.startsWith('/api/');
    const cached=async()=>sameOrigin&&!isApi?await caches.match(event.request,{ignoreSearch:true}):null;
    try{
      const response=await fetch(event.request);
      // Build 261: a transient Pages/Workers 5xx must not strip CSS/manifest/navigation when a safe cached copy exists.
      if(response.status>=500&&sameOrigin&&!isApi){const found=await cached();if(found)return found;}
      return response;
    }catch{
      const found=await cached();if(found)return found;
      if(event.request.mode==='navigate'){const shell=await caches.match('/');if(shell)return shell;}
      return new Response('Rosie Dazzlers is temporarily offline and this resource is not cached.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});

// Build 260 compatibility markers: rosie-app-v20260818build260 ; build260_ui_health_routes.json

// Historical Build 261 release token: rosie-app-v20260819build261
