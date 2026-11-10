// Build 838 — source-scoped operations/security/IT reconciliation.
// Existing diagnostic endpoints own their facts; this is a bounded read model.
export const HEALTH_SCHEMA_838='rosie.master-shell.operations-security-it-health.v1';
const SHA=/^[a-f0-9]{40}$/i;
const MAX_SOURCE_AGE_MS=5*60_000; // UI freshness guidance only, not an owner expiry policy.
const sourceLinks=Object.freeze([
  {id:'runtime',label:'I.T. runtime and infrastructure',family:'IT',
    owner:'Rosie I.T. diagnostics',route:'/admin-system-health.html',source:'Build 307 system_health_families'},
  {id:'alerts',label:'Production errors and support alerts',family:'IT',
    owner:'Rosie production support',route:'/admin-runtime-health.html',source:'Build 412 support_diagnostics'},
  {id:'backup',label:'Backup, retention and recovery drill',family:'Security',
    owner:'Rosie owner / recovery operator',route:'/admin/security-recovery.html',source:'Build 437 backup_recovery_evidence_closure'},
  {id:'security',label:'Privacy, role boundaries and access review',family:'Security',
    owner:'Rosie security owner',route:'/admin-security.html',source:'Security/privacy operational review'},
  {id:'operations',label:'Booking, worksite and customer concerns',family:'Operations',
    owner:'Rosie operations supervisor',route:'/admin-today.html',source:'Rosie booking and worksite primary records'},
  {id:'devices',label:'Customer, detailer and staff device proof',family:'Operations',
    owner:'Rosie original field/device reviewers',route:'/admin-handoff-acceptance.html#build830Recovery',source:'Build 830 role/device evidence'},
  {id:'modules',label:'Module readiness and source-history ownership',family:'Operations',
    owner:'Rosie module owner / independent reviewer',route:'/admin-handoff-acceptance.html#build827Registry',source:'Build 827/828 module registry'},
  {id:'comms',label:'Comms customer consent and incident continuity',family:'Master Shell',
    owner:'Rosie and Rosevear Comms owners',route:'/admin-handoff-acceptance.html#build837Continuity',source:'Build 837 local consent/incident review'},
  {id:'intelligence',label:'AI Data source health and event ACK',family:'Master Shell',
    owner:'Rosie and AI Data owners',route:'/admin-handoff-acceptance.html#build836Publication',source:'Build 834/836 Master source events'}
]);
const isoMs=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  new Date(Date.parse(value)).toISOString()===value?Date.parse(value):null;
function sourceWindow(source,expectedBuild,now){
  if(!source||source.status!==200||source.body?.build!==expectedBuild||
     typeof source.body!=='object')return {usable:false,state:'SOURCE_UNAVAILABLE',ageMinutes:null};
  const timestamp=isoMs(source.body.generated_at);
  if(timestamp===null||timestamp>now+60_000||now-timestamp>MAX_SOURCE_AGE_MS)
    return {usable:false,state:'STALE_OR_INVALID_SOURCE_CLOCK',ageMinutes:timestamp===null?null:Math.max(0,Math.floor((now-timestamp)/60000))};
  return {usable:true,state:'RECENT_SOURCE_RESPONSE',ageMinutes:Math.floor(Math.max(0,now-timestamp)/60000)};
}
export function baseHealth838({runtimeRevision=null,branch=null,generatedAt=new Date().toISOString(),
  originalSessionVerified=false}={}){
  if(isoMs(generatedAt)===null)throw Error('HOLD_INVALID_RUNTIME_CLOCK');
  return {schema:HEALTH_SCHEMA_838,build:838,sourceId:'rosiedazzlers',
    sourceRole:'OWNED_BUSINESS_SOURCE_SHELL',tenantBoundary:'owned_business_legacy',
    generatedAt,readOnly:true,manualRefreshOnly:true,
    localSessionVerified:originalSessionVerified===true,
    runtimeRevisionClaim:SHA.test(runtimeRevision??'')?runtimeRevision:null,
    runtimeBranchClaim:['dev','main'].includes(branch)?branch:null,
    runtimeRevisionIndependentlyVerified:false,productionExactShaVerifiedHere:false,
    sourceConnections:{aiData:'DISCONNECTED / HOLD',comms:'DISCONNECTED / HOLD',
      originalOwnerApprovalVerified:false,sourceSignedReceiptVerified:false,consumerAckVerified:false},
    sources:sourceLinks.map(row=>({...row,state:'NOT_CHECKED',evidenceClass:'AUTHORITATIVE_SCREEN_REFERENCE',
      observedAt:null,expiresAt:null,ageMinutes:null,nextAction:'Open the owning screen for original evidence; no result has been inferred.'})),
    outcomes:{originalCustomerOrStaffDataReturned:false,originalSourceRowsRead:0,
      databaseWrites:0,remoteProviderCalls:0,remoteMessagesSent:0,masterEventsPublished:0,
      cacheCleared:false,backupRun:false,restoreRun:false,externalConnectionPromoted:false},
    releasePolicy:'GitHub protected main plus independent Cloudflare exact-SHA acceptance; this request cannot certify itself.'};
}
// Source results come only from the existing protected GETs after an explicit manual refresh.
// Never derive an overall GREEN from missing data or a provider-configuration flag.
export function reconcileHealth838(base,{it=null,support=null,backup=null}={},now=Date.now()){
  if(base?.schema!==HEALTH_SCHEMA_838||!Number.isFinite(now))throw Error('HOLD_INVALID_SOURCE_SCOPE');
  const rows=base.sources.map(row=>({...row}));
  const update=(id,source,expectedBuild,derive)=>{
    const row=rows.find(r=>r.id===id),window=sourceWindow(source,expectedBuild,now);
    row.evidenceClass='PROTECTED_SOURCE_READ';row.state=window.state;
    row.ageMinutes=window.ageMinutes;
    if(window.usable){
      const observed=derive(source.body);
      row.state=observed.state;
      row.nextAction=observed.nextAction;
      row.observedAt=source.body.generated_at;
    }else row.nextAction=window.state==='SOURCE_UNAVAILABLE'?
      'Open the owning screen; restore the read-only diagnostic or required permission, then refresh once.':
      'Refresh the owning source; this old/invalid timestamp is not current proof.';
  };
  update('runtime',it,307,p=>{
    const state=p?.summary?.overall_state;
    if(p.ok!==true||!['GREEN','AMBER','RED'].includes(state))
      return {state:'HOLD_MALFORMED_IT_REPORT',nextAction:'Inspect the existing I.T. System Health family results.'};
    return {state:state==='GREEN'?'RECENT_IT_DIAGNOSTIC_PASS':state==='RED'?'IT_FAILURE_REPORTED':'IT_CONFIGURATION_OR_PROOF_REVIEW',
      nextAction:state==='GREEN'?'Runtime family observations passed; exact Production and provider transactions still require separate proof.':
        'Open I.T. System Health and inspect the named failing/partial family; do not create an obsolete launch prerequisite.'};
  });
  update('alerts',support,412,p=>{
    const state=p?.overall;
    if(!['critical','warning','hold','clear'].includes(state)||
      !p?.alert_counts||!Number.isInteger(p.alert_counts.critical))
      return {state:'HOLD_MALFORMED_SUPPORT_REPORT',nextAction:'Review the retained production support source.'};
    return {state:state==='critical'?'SOURCE_CRITICAL_ALERTS':state==='warning'?'SOURCE_WARNINGS':
      state==='clear'?'RECENT_SUPPORT_NO_REPORTED_ALERTS':'SOURCE_OWNER_OR_PROVIDER_HOLDS',
      nextAction:state==='clear'?'No alerts in this bounded report; it does not prove error-free history.':
        'Open production support diagnostics and triage source-linked errors, owner and resolution evidence.'};
  });
  update('backup',backup,437,p=>{
    const evidence=p?.evidence;
    if(!evidence||!['hold','closure_candidate'].includes(evidence.status)||
      evidence.truth_boundary?.production_restore_performed!==false)
      return {state:'HOLD_MALFORMED_BACKUP_REPORT',nextAction:'Review original dated backup/restore evidence.'};
    return {state:evidence.status==='closure_candidate'?'DATED_BACKUP_EVIDENCE_REVIEW_CANDIDATE':'BACKUP_OR_RECOVERY_EVIDENCE_HOLD',
      nextAction:evidence.status==='closure_candidate'?
        'A dated evidence candidate exists; the original owner still must verify restore and retention.':
        'Inspect current backup artifact, retention location and observed recovery drill. A runbook is not proof.'};
  });
  return {...base,generatedAt:new Date(now).toISOString(),sources:rows,
    reconciliation:{observedSourceCount:rows.filter(r=>r.observedAt).length,
      missingOrStaleCount:rows.filter(r=>['SOURCE_UNAVAILABLE','STALE_OR_INVALID_SOURCE_CLOCK'].includes(r.state)).length,
      unqueriedSourceCount:rows.filter(r=>r.state==='NOT_CHECKED').length,
      sourceAlertCount:rows.filter(r=>['SOURCE_CRITICAL_ALERTS','SOURCE_WARNINGS','IT_FAILURE_REPORTED'].includes(r.state)).length,
      independentOwnerAcceptance:false,masterConnectionState:'DISCONNECTED / HOLD',
      platformWideGreen:false,sourceExpiryPolicyApproved:false,
      noAutomatedPolling:true,noNewGateOrOldPreflightTask:true}};
}
