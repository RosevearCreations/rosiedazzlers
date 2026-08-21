import { serviceHeaders } from './staff-auth.js';
import { serviceReady, safeJson } from './daip-test-mode.js';

export const BUILD=260;

const BUILD260_ROADMAP=[
  ['b260_01','Deploy Build 260 and prove cache/script/service-worker parity','reliability','critical','/admin-startup-guide.html#ui-health'],
  ['b260_02','Apply outstanding Build 259 vehicle-size and Build 260 startup migrations in staging','reliability','critical','/admin-startup-guide.html#blockers'],
  ['b260_03','Accept bounded Photo Studio R2 sync, multi-placement and reset-to-default','media','critical','/admin-photo-studio.html'],
  ['b260_04','Accept database-first Media Health and bounded delivery sample','media','high','/admin-media-health.html'],
  ['b260_05','Run one fresh Creative Project through the clarified private DAIP start flow','daip','high','/admin-creative-projects.html'],
  ['b260_06','Accept editable Quote Pipeline and booking hand-off','operations','high','/admin-quotes.html'],
  ['b260_07','Accept uncertain vehicle-size staff review and customer confirm/cancel flow','booking','critical','/admin-booking.html'],
  ['b260_08','Complete booking, deposit, final-balance, refund and webhook production acceptance','payments','critical','/admin-startup-guide.html#production'],
  ['b260_09','Verify external email/SMS delivery and failure/retry evidence','reliability','critical','/admin-startup-guide.html#production'],
  ['b260_10','Complete transactional inventory posting, idempotency, shortage and reversal acceptance','operations','critical','/admin-inventory-posting.html'],
  ['b260_11','Finish catalog publish-readiness, supplier repair and sellable-item image review','operations','high','/admin-catalog.html'],
  ['b260_12','Finish deliberate public photo assignments, contextual alt text and local proof review','media','high','/admin-photo-studio.html'],
  ['b260_13','Complete owner-editable add-on landing content, pricing caveats and process explanations','seo','high','/admin-content.html'],
  ['b260_14','Populate Gallery with approved before/after, evidence, technique and efficiency proof','media','high','/admin-photo-studio.html'],
  ['b260_15','Complete real-device CSS/mobile acceptance on booking, pricing, services, maintenance and fleet','reliability','critical','/admin-ui-health.html'],
  ['b260_16','Complete keyboard, focus, label, contrast and reduced-motion accessibility review','customer','high','/admin-ui-health.html'],
  ['b260_17','Verify Search Console, sitemap/canonicals/schema and Google Business Profile evidence','seo','high','/admin-seo-tasks.html'],
  ['b260_18','Perform Supabase restore rehearsal and Cloudflare deployment rollback drill','reliability','critical','/admin-startup-guide.html#blockers'],
  ['b260_19','Implement/accept the private DAIP processing consumer, retry/dead-letter and reviewed derivatives path','daip','high','/admin-daip-media.html'],
  ['b260_20','Run controlled invite-only soft launch with monitoring, incident and daily evidence review','operations','critical','/admin-startup-guide.html']
].map((row,index)=>({id:row[0],item_key:row[0],title:row[1],workstream:row[2],priority:row[3],status:'planned',target_build:260,sort_order:(index+1)*10,source_document:'MASTER_VALUE_ROADMAP.md',cycle_key:'build260',is_current_cycle:true,action_path:row[4],owner_label:null,evidence_note:null}));

function counts(items){return items.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});}

export async function roadmapDashboard(env){
  if(!serviceReady(env)) return {build:BUILD,ready:false,source:'packaged_build260',warning:'Supabase service configuration is missing. Showing the current Build 260 roadmap read-only.',items:BUILD260_ROADMAP,counts:counts(BUILD260_ROADMAP),policy:null,gate_c:{state:'held',detail:'DAIP governance remains separate from ordinary project creation and public publishing.'}};
  const h=serviceHeaders(env);
  const [ir,pr]=await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/app_roadmap_execution_items?select=*&is_current_cycle=eq.true&order=sort_order.asc&limit=20`,{headers:h}),
    fetch(`${env.SUPABASE_URL}/rest/v1/daip_intake_validation_policy?select=*&policy_key=eq.active&limit=1`,{headers:h})
  ]);
  const it=await ir.text(),pt=await pr.text();
  const dbItems=ir.ok?(safeJson(it)||[]):[];
  const dbIsBuild260=dbItems.length>0&&dbItems.every(item=>Number(item.target_build||0)>=260||String(item.cycle_key||'')==='build260');
  const items=dbIsBuild260?dbItems:BUILD260_ROADMAP;
  const ready=ir.ok&&pr.ok&&dbIsBuild260;
  let warning=null;
  if(!ir.ok||!pr.ok)warning='Shared roadmap/policy data is unavailable. Showing the current Build 260 roadmap read-only.';
  else if(!dbIsBuild260)warning='The database still has an older current roadmap cycle. Apply the Build 260 startup catalog/health migration; the Build 260 roadmap is shown read-only meanwhile.';
  return {build:BUILD,ready,source:ready?'shared_database':'packaged_build260',warning,items,counts:counts(items),policy:pr.ok?((safeJson(pt)||[])[0]||null):null,gate_c:{state:'held',detail:'Gate C is a technical/governance checkpoint. Ordinary Creative Project creation and private intake remain separate from public publishing.'}};
}
export function clean(v,max=1200){return String(v??'').trim().slice(0,max)}
// Historical Build 237 compatibility token: export const BUILD=237;
