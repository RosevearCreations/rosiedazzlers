// Build 447 — Recovery Artifact & Drill Evidence Review.
// Read-only review over retained backup/recovery evidence.
const CURRENT_DAYS=30, AGING_DAYS=90;
export function buildRecoveryArtifactDrillEvidenceReview({closure={},generated_at=new Date().toISOString()}={}){
  const rows=Array.isArray(closure?.required)?closure.required:[];
  const mapped=rows.map((row)=>{
    const at=safeIso(row?.observed_at);
    const age=at?ageDays(at,generated_at):null;
    const freshness=!at?"missing":age<=CURRENT_DAYS?"current":age<=AGING_DAYS?"aging":"stale";
    return {...row,evidence_age_days:age,freshness};
  });
  const artifact=mapped.find(x=>x.id==="backup_artifact")||{};
  const retention=mapped.find(x=>x.id==="retention_location")||{};
  const drill=mapped.find(x=>x.id==="recovery_drill")||{};
  const stale=mapped.filter(x=>x.freshness==="stale").length;
  const aging=mapped.filter(x=>x.freshness==="aging").length;
  const missing=mapped.filter(x=>x.freshness==="missing").length;
  const status=missing?"owner_action":stale?"stale_review":aging?"aging_review":"current";
  return {
    authority:"recovery_artifact_drill_evidence_review",generated_at,status,
    freshness_policy:{current_max_days:CURRENT_DAYS,aging_max_days:AGING_DAYS},
    rows:mapped,
    backup_artifact:{observed_at:artifact.observed_at||null,age_days:artifact.evidence_age_days??null,freshness:artifact.freshness||"missing"},
    retention_location:{observed_at:retention.observed_at||null,age_days:retention.evidence_age_days??null,freshness:retention.freshness||"missing"},
    recovery_drill:{observed_at:drill.observed_at||null,age_days:drill.evidence_age_days??null,freshness:drill.freshness||"missing"},
    missing_count:missing,aging_count:aging,stale_count:stale,
    closure_candidate:closure?.closure_candidate===true&&missing===0,
    canonical_hold:{area:"Recovery / backup evidence",classification:"owner_action",operator_review_required:true,backlog_mutated:false,detail:missing?"Required recovery evidence remains missing or undated.":stale?"Recovery evidence exists but at least one item is stale and requires review.":"Recovery evidence is dated; operator review is still required before HOLD narrowing."},
    truth_boundary:{production_restore_performed:false,rollback_performed:false,dns_mutation_performed:false,secret_rotation_performed:false,destructive_r2_performed:false,provider_recovery_performed:false,schema_mutation_performed:false,business_data_mutation_performed:false,backlog_mutated:false,permanent_polling:false}
  };
}
function safeIso(v){const s=String(v??"").trim();if(!s)return null;const ms=Date.parse(s);return Number.isFinite(ms)?new Date(ms).toISOString():null}
function ageDays(v,now){const a=Date.parse(v),b=Date.parse(String(now||""));return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.floor((b-a)/86400000)):null}
