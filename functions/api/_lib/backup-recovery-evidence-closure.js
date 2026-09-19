// Build 437 — Backup & Recovery Evidence Closure.
// Pure read-only classification over retained Build 418 operational proof.
export function buildBackupRecoveryEvidenceClosure({proof=null,source_available=true,generated_at=new Date().toISOString()}={}){
  const generatedAt=clean(generated_at)||new Date().toISOString();
  const available=source_available===true&&proof&&typeof proof==="object";
  const backup=available?objectOrEmpty(proof.backup):{};
  const drill=available?objectOrEmpty(proof.recovery_drill):{};
  const exportArtifact=available?objectOrEmpty(proof.export_artifact):{};
  const accountant=available?objectOrEmpty(proof.accountant_export):{};
  const required=[
    classifyRequired({id:"backup_artifact",title:"Current backup artifact observed",observed:available&&backup.artifact_observed===true,observed_at:backup.verified_at,source_available:available,generated_at:generatedAt,detail_ok:"Retained verified evidence records a current backup artifact.",detail_open:"A recovery route or runbook does not prove that a current backup artifact exists."}),
    classifyRequired({id:"retention_location",title:"Backup retention location observed",observed:available&&backup.retention_location_observed===true,observed_at:backup.verified_at,source_available:available,generated_at:generatedAt,detail_ok:"Retained verified evidence records the backup retention/storage location without exposing note contents.",detail_open:"Record where the verified backup is retained before treating recovery as operationally proven."}),
    classifyRequired({id:"recovery_drill",title:"Recovery / rollback drill observed",observed:available&&drill.observed===true,observed_at:drill.verified_at,source_available:available,generated_at:generatedAt,detail_ok:"Retained verified evidence records a bounded recovery/rollback drill observation.",detail_open:"A separately authorized bounded recovery/rollback drill still requires dated observed evidence."})
  ];
  const supporting={
    accountant_export_runtime_usable:available&&accountant.usable===true,
    retained_export_artifact_observed:available&&exportArtifact.observed===true,
    retained_export_artifact_observed_at:safeIso(exportArtifact.verified_at),
    retained_export_artifact_age_days:ageDays(exportArtifact.verified_at,generatedAt),
    source_operational_proof_status:available?clean(proof.status)||"unknown":"unavailable"
  };
  const observed=required.filter(r=>r.status==="observed_dated"), unavailable=required.filter(r=>r.status==="unavailable"), outstanding=required.filter(r=>r.status!=="observed_dated");
  const closureCandidate=required.length>0&&observed.length===required.length;
  const timestamps=required.map(r=>r.observed_at).filter(Boolean).sort();
  return {
    authority:"backup_recovery_evidence_closure",generated_at:generatedAt,status:closureCandidate?"closure_candidate":"hold",
    decision:closureCandidate?"operator_review_may_narrow_hold":"recovery_backup_hold_remains_open",closure_candidate:closureCandidate,
    required_evidence_count:required.length,dated_evidence_count:observed.length,unavailable_evidence_count:unavailable.length,
    latest_observed_at:timestamps.length?timestamps[timestamps.length-1]:null,required,
    outstanding:outstanding.map(({id,title,status,classification,observed_at})=>({id,title,status,classification,observed_at})),supporting,
    canonical_hold:{area:"Recovery / backup evidence",classification:"owner_action",backlog:"STARTUP_GO_LIVE_BLOCKERS.md",backlog_mutated:false,detail:closureCandidate?"All required dated retained recovery evidence is observed. An operator may review whether the canonical HOLD can be narrowed.":"Backup artifact, retention location and bounded recovery-drill evidence are not all currently observed and dated."},
    truth_boundary:{retained_source_authority:"backup_restore_accountant_export_operational_proof",source_route_presence_is_not_artifact_proof:true,source_green_is_not_recovery_observation:true,production_restore_performed:false,rollback_performed:false,dns_mutation_performed:false,secret_rotation_performed:false,destructive_r2_performed:false,provider_mutation_performed:false,schema_mutation_performed:false,business_data_mutation_performed:false,export_generation_performed:false,backlog_mutated:false,evidence_note_exposed:false,customer_identity_exposed:false,permanent_polling:false}
  };
}
function classifyRequired({id,title,observed,observed_at,source_available,generated_at,detail_ok,detail_open}){
  if(!source_available)return{id,title,status:"unavailable",classification:"unavailable",observed:false,attributable:false,observed_at:null,age_days:null,detail:"The authorized retained recovery evidence source is unavailable."};
  const observedAt=safeIso(observed_at),dated=observed===true&&Boolean(observedAt);
  return{id,title,status:dated?"observed_dated":"owner_action",classification:dated?"owner_action_observed":"owner_action",observed:observed===true,attributable:dated,observed_at:dated?observedAt:null,age_days:dated?ageDays(observedAt,generated_at):null,detail:dated?detail_ok:detail_open};
}
function safeIso(v){const t=clean(v);if(!t)return null;const ms=Date.parse(t);return Number.isFinite(ms)?new Date(ms).toISOString():null}
function ageDays(v,now){const a=Date.parse(String(v||"")),b=Date.parse(String(now||""));return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.floor((b-a)/86400000)):null}
function objectOrEmpty(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function clean(v){return String(v??"").trim()}
