// Build 754: independently signed evidence check; NEVER a source-closure writer.
// Sign exactly the documented field-order transcript, including the role/domain prefix.
export const OWNER_FIELDS754=Object.freeze([
  'schema','booking_id','period','baseline_snapshot_sha256','retest_snapshot_sha256',
  'source_attestation_sha256','source_correction_reference','owner_id','owner_role',
  'decision','issued_at','expires_at','nonce','key_id'
]);
export const SOURCE_FIELDS754=Object.freeze([
  'schema','booking_id','period','baseline_snapshot_sha256','retest_snapshot_sha256',
  'source_correction_reference','source_record_sha256','issuer_id','issuer_role',
  'issued_at','expires_at','nonce','key_id'
]);
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
const booking=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const period=value=>typeof value==='string'&&/^20\d{2}-(0[1-9]|1[012])$/.test(value);
const iso=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const safeId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/.test(value);
const nonce=value=>typeof value==='string'&&/^[0-9a-f]{32,64}$/i.test(value);
const bytes=text=>new TextEncoder().encode(text);

export function canonicalEconomicReceipt754(payload,kind){
  const fields=kind==='owner'?OWNER_FIELDS754:kind==='source'?SOURCE_FIELDS754:null;
  if(!fields||!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==fields.length||
    !fields.every(key=>Object.hasOwn(payload,key)&&typeof payload[key]==='string'))throw Error('Receipt has missing, extra or invalid canonical fields.');
  return bytes(`rosie-economics-receipt-v754:${kind}:`+JSON.stringify(fields.map(key=>[key,payload[key]])));
}

function decodeBase64(value,expectedLength){
  if(typeof value!=='string'||value.length>200||value.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const b=Uint8Array.from(atob(value),x=>x.charCodeAt(0));return b.length===expectedLength?b:null;}catch{return null;}
}

export async function sha256Receipt754(bytesValue){
  const digest=await crypto.subtle.digest('SHA-256',bytesValue);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function timingValid(payload,now){
  if(!iso(payload.issued_at)||!iso(payload.expires_at))return false;
  const issued=Date.parse(payload.issued_at),expiry=Date.parse(payload.expires_at);
  return issued<=now+5*60000&&issued>=now-7*86400000&&expiry>now&&expiry>issued&&expiry-issued<=48*3600000;
}

const held=(status,detail,extra={})=>({ok:true,build:754,closure_gate:status,detail,
  owner_receipt_authenticated:false,source_attestation_authenticated:false,
  source_correction_record_verified:false,closure_recorded:false,closure_allowed:false,
  automatic_business_write:false,...extra});

/** Valid signatures grant *review eligibility*, not actual receipt or correction closure. */
export async function verifyOwnerEconomicProof754({owner_receipt,source_attestation,live,env,now=Date.now()}={}){
  const ownerKey=decodeBase64(env?.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64,32),
    sourceKey=decodeBase64(env?.ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64,32);
  const ownerKeyId=env?.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID,sourceKeyId=env?.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID;
  if(!ownerKey||!sourceKey||!safeId(ownerKeyId)||!safeId(sourceKeyId))
    return held('HOLD_KEYS_NOT_CONFIGURED','Two distinct pinned public keys and key IDs must be configured server-side.');
  if(ownerKeyId===sourceKeyId||ownerKey.every((value,i)=>value===sourceKey[i]))
    return held('HOLD_KEYS_NOT_INDEPENDENT','The owner and source witness keys/identities must be distinct.');
  const op=owner_receipt?.payload,sp=source_attestation?.payload;
  let ownerTranscript,sourceTranscript;
  try{ownerTranscript=canonicalEconomicReceipt754(op,'owner');sourceTranscript=canonicalEconomicReceipt754(sp,'source');}
  catch{return held('HOLD_RECEIPT_FORMAT','Receipts must use the exact versioned canonical field set.');}
  const ownerSig=decodeBase64(owner_receipt?.signature_b64,64),sourceSig=decodeBase64(source_attestation?.signature_b64,64);
  if(!ownerSig||!sourceSig)return held('HOLD_SIGNATURE_FORMAT','Both detached Ed25519 signatures are required.');
  if(op.schema!=='rosie-owner-economic-receipt-v754'||sp.schema!=='rosie-source-correction-attestation-v754'||
    !booking(op.booking_id)||op.booking_id!==sp.booking_id||!period(op.period)||op.period!==sp.period||
    !hash(op.baseline_snapshot_sha256)||!hash(op.retest_snapshot_sha256)||op.baseline_snapshot_sha256===op.retest_snapshot_sha256||
    op.baseline_snapshot_sha256!==sp.baseline_snapshot_sha256||op.retest_snapshot_sha256!==sp.retest_snapshot_sha256||
    !hash(op.source_attestation_sha256)||!hash(sp.source_record_sha256)||
    !safeId(op.source_correction_reference)||op.source_correction_reference!==sp.source_correction_reference||
    !safeId(op.owner_id)||!safeId(sp.issuer_id)||op.owner_id===sp.issuer_id||
    op.owner_role!=='owner'||!['finance_reviewer','inventory_reviewer','shift_reviewer'].includes(sp.issuer_role)||
    !['approve_for_manual_closure_review','retain_hold'].includes(op.decision)||
    !nonce(op.nonce)||!nonce(sp.nonce)||op.nonce===sp.nonce||
    op.key_id!==ownerKeyId||sp.key_id!==sourceKeyId||!timingValid(op,now)||!timingValid(sp,now))
    return held('HOLD_RECEIPT_SCOPE','Booking, issuer, roles, key IDs, expiry, source scope or nonce is invalid.');
  if((await sha256Receipt754(sourceTranscript))!==op.source_attestation_sha256)
    return held('HOLD_ATTESTATION_BINDING','Owner signature must bind the exact source-witness transcript hash.');
  try{
    const [ownerImported,sourceImported]=await Promise.all([
      crypto.subtle.importKey('raw',ownerKey,{name:'Ed25519'},false,['verify']),
      crypto.subtle.importKey('raw',sourceKey,{name:'Ed25519'},false,['verify'])]);
    const [ownerValid,sourceValid]=await Promise.all([
      crypto.subtle.verify('Ed25519',ownerImported,ownerSig,ownerTranscript),
      crypto.subtle.verify('Ed25519',sourceImported,sourceSig,sourceTranscript)]);
    if(!ownerValid||!sourceValid)return held('HOLD_SIGNATURE_INVALID','At least one independently signed transcript failed Ed25519 verification.');
  }catch{return held('HOLD_CRYPTO_UNAVAILABLE','The runtime could not verify Ed25519 signatures.');}
  const signatureFlags={owner_receipt_authenticated:true,source_attestation_authenticated:true};
  if(live?.build!==753||live.source_build!==752||!live.ok||!Array.isArray(live.rows)||!Array.isArray(live.exceptions)||
    `${live.period?.year}-${String(live.period?.month).padStart(2,'0')}`!==op.period||
    live.snapshot_sha256!==op.retest_snapshot_sha256)
    return held('HOLD_LIVE_SOURCE_DRIFT','Signed retest hash or period differs from a fresh authenticated source read.',signatureFlags);
  const matches=live.rows.filter(row=>row.booking_id===op.booking_id);
  if(matches.length!==1||matches[0].decision_gate!=='owner_review_candidate'||
    live.exceptions.some(issue=>issue.booking_id===op.booking_id))
    return held('HOLD_SOURCE_EXCEPTIONS','The current owning economic source is missing or still reports an exception.',signatureFlags);
  if(op.decision==='retain_hold')return held('HOLD_OWNER_DECISION','The authenticated owner decision explicitly retains HOLD.',signatureFlags);
  return {ok:true,build:754,closure_gate:'ELIGIBLE_FOR_MANUAL_CLOSURE_REVIEW',
    detail:'Independent owner and source-witness signatures match the live source. Verify the original correction record and append an attributable approval in the owning system before closure.',
    ...signatureFlags,source_correction_record_verified:false,closure_recorded:false,closure_allowed:false,
    automatic_business_write:false,source_recheck_matched:true,receipt_reference:op.source_correction_reference,
    booking_id:op.booking_id,source_snapshot_sha256:op.retest_snapshot_sha256};
}
