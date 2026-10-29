// Build 699. Local, owner-operated comparison only. No historical trust assertion.
// Exported for offline regression; never sends baseline files to a server.
const SHA=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLASSES=new Set(['OWNER_HOLD_ACK_FOLLOW_UP','OWNER_ACK_ESCALATION_OVERDUE',
  'EXPIRED_REVIEW_AUTHORITY_ESCALATION','INDEPENDENT_REVIEW_OVERDUE',
  'OWNER_ASSIGNMENT_OVERDUE','ACKNOWLEDGED_HOLD_UNRESOLVED','MANUAL_HOLD_MONITOR']);
const utf8=s=>new TextEncoder().encode(s);
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8(s))),
  b=>b.toString(16).padStart(2,'0')).join('');}
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
function safeCase(row){
  if(!plain(row)||!SHA.test(row.case_key)||!CLASSES.has(row.classification)||
    typeof row.phase!=='string'||!/^[-A-Z_0-9]{1,80}$/.test(row.phase)||
    row.manual_hold!==true||row.resend_permitted!==false||row.owner_release_authorized!==false)
    throw Error('Snapshot case fails HOLD safety validation');
  return {case_key:row.case_key,classification:row.classification,phase:row.phase,
    manual_hold:true,resend_permitted:false,owner_release_authorized:false};
}
function core(snapshot){return {schema:'rosie.gift_hold.snapshot.v699',
  source_build:698,source_snapshot_sha256:snapshot.source_snapshot_sha256,
  case_count:snapshot.case_count,truncated_possible:snapshot.truncated_possible,
  historical_audit_complete:false,cases:snapshot.cases};}
export async function captureHoldSnapshot(data,at=new Date().toISOString()){
  if(!plain(data)||data.ok!==true||data.build!==698||data.read_only!==true||
    data.connection_state!=='DISCONNECTED'||data.historical_audit_complete!==false||
    !SHA.test(data.snapshot_sha256)||!Array.isArray(data.followups)||
    data.followups.length>100||data.case_count!==data.followups.length||
    typeof data.truncated_possible!=='boolean'||
    data.confirmed_delivery_count!==0||data.authorized_closure_count!==0||
    data.independently_confirmed_recurrence_count!==null)
    throw Error('Current owner HOLD source is incomplete or unsafe');
  if(typeof at!=='string'||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)
    throw Error('Capture timestamp invalid');
  const cases=[];
  for(const row of data.followups){
    if(!plain(row)||!UUID.test(row.case_id)||!UUID.test(row.attempt_id)||
      !UUID.test(row.certificate_id)||!Number.isSafeInteger(row.checkout_line_number)||
      row.checkout_line_number<1||!CLASSES.has(row.follow_up_classification)||
      row.delivery_evidence!=='NOT_CERTIFIED'||row.recurrence_history!=='NOT_INFERRED_FROM_ONE_SNAPSHOT'||
      row.manual_hold!==true||row.resend_permitted!==false||
      row.customer_contact_authorized!==false||row.owner_release_authorized!==false||
      row.connection_state!=='DISCONNECTED')throw Error('Untrusted source row; HOLD continues');
    cases.push(safeCase({case_key:await hash([row.case_id,row.attempt_id,row.certificate_id,
      row.checkout_line_number].join('|')),classification:row.follow_up_classification,
      phase:row.phase,manual_hold:true,resend_permitted:false,owner_release_authorized:false}));
  }
  cases.sort((a,b)=>a.case_key.localeCompare(b.case_key));
  if(new Set(cases.map(r=>r.case_key)).size!==cases.length)throw Error('Duplicate HOLD identity');
  const snapshot={...core({source_snapshot_sha256:data.snapshot_sha256,
    case_count:cases.length,truncated_possible:data.truncated_possible,cases}),
    captured_at:at,provenance:'OWNER_DOWNLOADED_LOCAL_COPY_NOT_INDEPENDENTLY_ATTESTED',
    prior_snapshot_authenticated:false};
  snapshot.local_integrity_sha256=await hash(JSON.stringify(core(snapshot)));
  return snapshot;
}
export async function validateHoldSnapshot(snapshot){
  if(!plain(snapshot)||snapshot.schema!=='rosie.gift_hold.snapshot.v699'||
    snapshot.source_build!==698||!SHA.test(snapshot.source_snapshot_sha256)||
    !SHA.test(snapshot.local_integrity_sha256)||
    !Array.isArray(snapshot.cases)||snapshot.cases.length>100||
    snapshot.case_count!==snapshot.cases.length||typeof snapshot.truncated_possible!=='boolean'||
    snapshot.historical_audit_complete!==false||snapshot.prior_snapshot_authenticated!==false||
    snapshot.provenance!=='OWNER_DOWNLOADED_LOCAL_COPY_NOT_INDEPENDENTLY_ATTESTED'||
    typeof snapshot.captured_at!=='string'||!Number.isFinite(Date.parse(snapshot.captured_at))||
    new Date(snapshot.captured_at).toISOString()!==snapshot.captured_at)
    throw Error('Snapshot format or provenance invalid');
  const cases=snapshot.cases.map(safeCase);
  for(let i=1;i<cases.length;i++)if(cases[i-1].case_key>=cases[i].case_key)
    throw Error('Duplicate or unordered snapshot case keys');
  if(await hash(JSON.stringify(core({...snapshot,cases})))!==snapshot.local_integrity_sha256)
    throw Error('Snapshot integrity digest mismatch');
  return {...snapshot,cases};
}
export async function compareHoldSnapshots(previous,current){
  const a=await validateHoldSnapshot(previous),b=await validateHoldSnapshot(current);
  if(Date.parse(a.captured_at)>=Date.parse(b.captured_at))
    throw Error('Prior capture must be older than current capture');
  const prior=new Map(a.cases.map(x=>[x.case_key,x]));
  let unchanged=0,changed=0,appeared=0;
  for(const item of b.cases){const old=prior.get(item.case_key);
    if(!old)appeared++;
    else if(old.classification!==item.classification||old.phase!==item.phase)changed++;
    else unchanged++;
    prior.delete(item.case_key);}
  return {prior_capture:a.captured_at,current_capture:b.captured_at,
    prior_snapshot_sha256:a.source_snapshot_sha256,
    current_snapshot_sha256:b.source_snapshot_sha256,
    changed_in_bounded_sample:changed,new_in_bounded_sample:appeared,
    absent_from_current_bounded_sample:prior.size,unchanged_in_bounded_sample:unchanged,
    prior_count:a.case_count,current_count:b.case_count,
    sample_limit:100,possible_truncation:a.truncated_possible||b.truncated_possible,
    independent_historical_verification:false,confirmed_recurrence_count:null,
    confirmed_delivery_count:0,authorized_closure_count:0,
    manual_hold:true,resend_permitted:false,connection_state:'DISCONNECTED',
    notice:'Local self-supplied copies are not independently authenticated history. Differences, disappearance or digest drift are NOT delivery, closure, recurrence verification or owner release.'};
}
