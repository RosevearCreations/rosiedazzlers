// Build 438/448 — Authenticated Device & Visual Acceptance + Cross-Device Refresh.
// Pure classification over retained launch observations + Build 419 safe workflow evidence.
// Build 448 adds bounded freshness so old observations cannot silently satisfy the current-release refresh.
// Raw evidence-note contents are inspected server-side only and are never returned.

const ROLE_DEFINITIONS = Object.freeze([
  { id:"customer", key:"booking_e2e", title:"Customer workflow", role_pattern:/customer|booking|account|checkout|known customer|invite/i },
  { id:"detailer", key:"mobile", title:"Detailer workflow", role_pattern:/detailer|field|assigned job|job workflow/i },
  { id:"operations", key:"operations", title:"Operations workflow", role_pattern:/operations|dispatcher|dispatch|schedule|work queue|command cent(re|er)/i },
  { id:"admin", key:"accessibility", title:"Admin workflow", role_pattern:/admin|administrator|back office|management/i }
]);

const DEVICE_PATTERNS = Object.freeze({
  phone: /\b(phone|iphone|android phone|mobile device|mobile viewport)\b/i,
  tablet: /\b(tablet|ipad)\b/i,
  desktop: /\b(desktop|laptop|notebook)\b/i
});
const BROWSER_PATTERNS = Object.freeze({
  chrome: /\b(chrome|chromium)\b/i,
  safari: /\bsafari\b/i,
  firefox: /\bfirefox\b/i,
  edge: /\b(edge|msedge)\b/i
});
const AUTH_PATTERN = /\b(authenticated|signed[ -]?in|logged[ -]?in|login session|staff session|customer account session|account session)\b/i;
const VIEWPORT_PATTERN = /\b(viewport|screen width|width\s*[:=]?\s*\d{3,4}\s*px|\d{3,4}\s*px)\b/i;
const OUTCOME_PATTERN = /\b(pass|passed|success|successful|working|works|usable|rendered|verified|complete|completed|no errors?|no blocking errors?)\b/i;
const ROUTE_TOKEN_PATTERN = /\/(?:app|admin|book|account|detailer)(?:[a-z0-9._/-]*)/ig;

export function buildAuthenticatedDeviceVisualAcceptance({
  launch_evidence = [],
  workflow_evidence = null,
  source_available = true,
  generated_at = new Date().toISOString(),
  freshness_days = 30
} = {}) {
  const generatedAt=clean(generated_at)||new Date().toISOString();
  const freshnessDays=Math.max(1,Math.min(90,Number(freshness_days)||30));
  const rows=Array.isArray(launch_evidence)?launch_evidence:[];
  const byKey=new Map(rows.map(row=>[clean(row?.evidence_key),row]));
  const workflowRoles=new Map((Array.isArray(workflow_evidence?.roles)?workflow_evidence.roles:[]).map(row=>[clean(row?.id),row]));
  const available=source_available===true&&workflow_evidence&&typeof workflow_evidence==="object";

  const roles=ROLE_DEFINITIONS.map(definition=>classifyRole({
    definition,
    row:byKey.get(definition.key)||null,
    workflowRole:workflowRoles.get(definition.id)||null,
    sourceAvailable:available,
    generatedAt,
    freshnessDays
  }));

  const devices=Object.keys(DEVICE_PATTERNS).map(deviceClass=>{
    const matching=roles.filter(role=>role.status==="observed_dated"&&role.device_classes.includes(deviceClass));
    const timestamps=matching.map(role=>role.observed_at).filter(Boolean).sort();
    return {
      id:deviceClass,
      title:deviceClass==="phone"?"Phone observation":deviceClass==="tablet"?"Tablet observation":"Desktop observation",
      status:available?(matching.length?"observed_dated":"owner_action"):"unavailable",
      classification:available?(matching.length?"owner_action_observed":"owner_action"):"unavailable",
      observed:matching.length>0,
      observed_at:timestamps.length?timestamps[timestamps.length-1]:null,
      age_days:timestamps.length?ageDays(timestamps[timestamps.length-1],generatedAt):null,
      roles:matching.map(role=>role.id)
    };
  });

  const roleOutstanding=roles.filter(role=>role.status!=="observed_dated");
  const staleRoles=roles.filter(role=>role.stale===true);
  const deviceOutstanding=devices.filter(device=>device.status!=="observed_dated");
  const closureCandidate=available&&roleOutstanding.length===0&&deviceOutstanding.length===0;
  const timestamps=roles.map(role=>role.observed_at).filter(Boolean).sort();

  return {
    authority:"authenticated_device_visual_acceptance",
    generated_at:generatedAt,
    status:closureCandidate?"closure_candidate":"hold",
    decision:closureCandidate?"operator_review_may_narrow_device_visual_hold":"authenticated_device_visual_evidence_incomplete",
    closure_candidate:closureCandidate,
    required_role_count:roles.length,
    freshness_days:freshnessDays,
    freshness_basis:"verified_at_vs_generated_at",
    dated_role_count:roles.filter(role=>role.status==="observed_dated").length,
    stale_role_count:staleRoles.length,
    required_device_count:devices.length,
    dated_device_count:devices.filter(device=>device.status==="observed_dated").length,
    latest_observed_at:timestamps.length?timestamps[timestamps.length-1]:null,
    roles,
    devices,
    outstanding_roles:roleOutstanding.map(({id,title,status,classification})=>({id,title,status,classification})),
    outstanding_devices:deviceOutstanding.map(({id,title,status,classification})=>({id,title,status,classification})),
    canonical_hold:{
      area:"Independent device / visual evidence",
      classification:"owner_action",
      backlog:"STARTUP_GO_LIVE_BLOCKERS.md",
      backlog_mutated:false,
      detail:closureCandidate
        ?"Authenticated Customer/Detailer/Operations/Admin evidence is dated and representative phone/tablet/desktop coverage is present. An operator may review whether the canonical HOLD can be narrowed."
        :"Authenticated Customer/staff role evidence and representative phone/tablet/desktop coverage are not all current within the bounded refresh window."
    },
    truth_boundary:{
      retained_workflow_authority:"customer_staff_production_workflow_evidence",
      source_responsive_checks_are_supporting_only:true,
      source_green_is_not_real_device_proof:true,
      stale_observation_is_not_current_release_proof:true,
      evidence_note_exposed:false,
      customer_identity_exposed:false,
      protected_content_copied:false,
      automated_screenshot_capture:false,
      automated_screenshot_polling:false,
      customer_or_booking_mutation_performed:false,
      role_or_capability_mutation_performed:false,
      provider_transaction_performed:false,
      destructive_storage_performed:false,
      business_data_mutation_performed:false,
      permanent_polling:false
    }
  };
}

function classifyRole({definition,row,workflowRole,sourceAvailable,generatedAt,freshnessDays}) {
  if(!sourceAvailable){
    return emptyRole(definition,"unavailable","unavailable","Authorized launch/workflow evidence is unavailable.");
  }
  if(clean(workflowRole?.status)==="unavailable"){
    return emptyRole(definition,"unavailable","unavailable","The retained workflow authority cannot prove this role observation.");
  }

  const note=clean(row?.evidence_note,4000);
  const verifiedAt=safeIso(row?.verified_at);
  const retainedVerified=clean(workflowRole?.status)==="verified";
  const roleLanguage=definition.role_pattern.test(note);
  const authentication=AUTH_PATTERN.test(note);
  const browserClasses=Object.entries(BROWSER_PATTERNS).filter(([,pattern])=>pattern.test(note)).map(([name])=>name);
  const deviceClasses=Object.entries(DEVICE_PATTERNS).filter(([,pattern])=>pattern.test(note)).map(([name])=>name);
  const routes=safeRoutes(note);
  const viewportWidths=viewportWidthsFrom(note);
  const viewport=VIEWPORT_PATTERN.test(note)||viewportWidths.length>0;
  const outcome=OUTCOME_PATTERN.test(note);
  const evidenceComplete=clean(row?.status)==="verified"&&Boolean(verifiedAt)&&retainedVerified&&roleLanguage&&authentication&&browserClasses.length>0&&deviceClasses.length>0&&routes.length>0&&viewport&&outcome;
  const observedAge=verifiedAt?ageDays(verifiedAt,generatedAt):null;
  const fresh=evidenceComplete&&observedAge!==null&&observedAge<=freshnessDays;
  const stale=evidenceComplete&&!fresh;
  const complete=evidenceComplete&&fresh;

  const missing=[];
  if(!retainedVerified) missing.push("retained workflow verification");
  if(!roleLanguage) missing.push("role/workflow");
  if(!authentication) missing.push("authenticated-session");
  if(!browserClasses.length) missing.push("browser");
  if(!deviceClasses.length) missing.push("device class");
  if(!routes.length) missing.push("route");
  if(!viewport) missing.push("viewport/width");
  if(!outcome) missing.push("outcome");
  if(!verifiedAt) missing.push("dated verification");
  if(stale) missing.push(`fresh observation <= ${freshnessDays} days`);

  return {
    id:definition.id,
    key:definition.key,
    title:definition.title,
    status:complete?"observed_dated":"owner_action",
    classification:complete?"owner_action_observed":"owner_action",
    observed:evidenceComplete,
    current:complete,
    fresh,
    stale,
    observed_at:evidenceComplete?verifiedAt:null,
    age_days:evidenceComplete?observedAge:null,
    device_classes:deviceClasses,
    browser_classes:browserClasses,
    routes,
    viewport_widths:viewportWidths,
    authentication_evidence_present:authentication,
    browser_evidence_present:browserClasses.length>0,
    route_evidence_present:routes.length>0,
    viewport_evidence_present:viewport,
    outcome_evidence_present:outcome,
    retained_workflow_verified:retainedVerified,
    evidence_note_present:Boolean(note),
    evidence_note_exposed:false,
    missing_evidence:complete?[]:missing,
    detail:complete
      ?`A current authenticated role observation records device, browser, route, viewport and outcome evidence within the ${freshnessDays}-day refresh window.`
      :stale
        ?`The authenticated role observation is stale (${observedAge} days old); renew it within the ${freshnessDays}-day refresh window.`
        :"Record a verified dated authenticated observation with role, device, browser, route, viewport and outcome evidence."
  };
}

function emptyRole(definition,status,classification,detail){
  return {id:definition.id,key:definition.key,title:definition.title,status,classification,observed:false,current:false,fresh:false,stale:false,observed_at:null,age_days:null,device_classes:[],browser_classes:[],routes:[],viewport_widths:[],authentication_evidence_present:false,browser_evidence_present:false,route_evidence_present:false,viewport_evidence_present:false,outcome_evidence_present:false,retained_workflow_verified:false,evidence_note_present:false,evidence_note_exposed:false,missing_evidence:["authorized evidence source"],detail};
}
function safeRoutes(note){
  const values=[];
  for(const match of String(note||"").matchAll(ROUTE_TOKEN_PATTERN)){
    const route=String(match[0]||"").split(/[?#]/)[0].slice(0,120);
    if(route&&!values.includes(route)) values.push(route);
  }
  return values.slice(0,6);
}
function viewportWidthsFrom(note){
  const values=[];
  for(const match of String(note||"").matchAll(/\b(\d{3,4})\s*px\b/ig)){
    const width=Number(match[1]);
    if(width>=240&&width<=3840&&!values.includes(width)) values.push(width);
  }
  return values.slice(0,4);
}
function safeIso(value){const text=clean(value);if(!text)return null;const ms=Date.parse(text);return Number.isFinite(ms)?new Date(ms).toISOString():null}
function ageDays(value,now){const a=Date.parse(String(value||"")),b=Date.parse(String(now||""));return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.floor((b-a)/86400000)):null}
function clean(value,max=2000){return String(value??"").trim().slice(0,max)}
