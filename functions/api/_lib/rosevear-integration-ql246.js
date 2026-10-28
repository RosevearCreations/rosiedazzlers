// QL-246 canonical public source proof contract; no signing key or trust anchor here.
export const QL246_KEYS=[
  'schema_version','source_system','repository','source_revision',
  'challenge_id','challenge_sha256','business_id','tenant_id',
  'environment','ci_run_url','allowed_methods','allowed_paths',
  'negative_tests','gateway_audit_receipt_id','health_receipt_id',
  'capabilities_receipt_id','registered_key_id','owner_authorization',
  'connection_state','external_gateway_get_verified','durable_audit_verified',
  'owner_identity_verified','issued_at','expires_at'
];
export const QL246_DENIAL_KEYS=[
  'nonce_replay_denied','stale_request_denied','cross_business_denied',
  'cross_tenant_denied','revoked_key_denied','write_denied','dispatch_denied'
];
export function canonicalQl246Payload(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==QL246_KEYS.length||
    QL246_KEYS.some(key=>!Object.hasOwn(payload,key)))throw Error('QL246 payload keys mismatch');
  return QL246_KEYS.map(key=>JSON.stringify([key,payload[key]])).join('\n');
}
export function pendingQl246SourceProof(revision=null){
  // Deliberately incomplete; do NOT store this as docs/integration/ql246-source-proof.json.
  return {schema_version:'rosevear.integration.v1',source_system:'rosiedazzlers',
    repository:'RosevearCreations/rosiedazzlers',
    source_revision:/^[a-f0-9]{40}$/.test(String(revision||''))?revision:null,
    challenge_id:null,challenge_sha256:null,business_id:'rosiedazzlers',tenant_id:null,
    environment:'nonproduction',ci_run_url:null,allowed_methods:['GET'],
    allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
    negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(key=>[key,false])),
    gateway_audit_receipt_id:null,health_receipt_id:null,capabilities_receipt_id:null,
    registered_key_id:null,owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',
    external_gateway_get_verified:false,durable_audit_verified:false,
    owner_identity_verified:false,issued_at:null,expires_at:null};
}
export function checkQl246ProofShape(envelope,now=Date.now()){
  if(!envelope||Object.keys(envelope).sort().join(',')!=='payload,publicKeyPem,signature')
    return {ok:false,reason:'Envelope must have exactly publicKeyPem, payload and signature'};
  const p=envelope.payload;
  try{canonicalQl246Payload(p);}catch{return {ok:false,reason:'Payload schema mismatch'};}
  const tests=p.negative_tests;
  if(!tests||Object.keys(tests).length!==7||QL246_DENIAL_KEYS.some(k=>tests[k]!==true))
    return {ok:false,reason:'Seven original denial receipts remain unverified'};
  if(p.schema_version!=='rosevear.integration.v1'||p.source_system!=='rosiedazzlers'||
    p.repository!=='RosevearCreations/rosiedazzlers'||p.business_id!=='rosiedazzlers'||
    p.tenant_id!==null||p.environment!=='nonproduction'||
    !/^[0-9a-f]{40}$/.test(String(p.source_revision||''))||
    !/^np-[A-Za-z0-9_-]+$/.test(String(p.challenge_id||''))||
    !/^[0-9a-f]{64}$/.test(String(p.challenge_sha256||''))||
    !/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/.test(String(p.ci_run_url||''))||
    JSON.stringify(p.allowed_methods)!=='["GET"]'||
    JSON.stringify(p.allowed_paths)!=='["/api/integration/v1/health","/api/integration/v1/capabilities"]'||
    p.owner_authorization!=='NOT_GIVEN'||p.connection_state!=='DISCONNECTED'||
    p.external_gateway_get_verified!==false||p.durable_audit_verified!==false||
    p.owner_identity_verified!==false||
    ![p.gateway_audit_receipt_id,p.health_receipt_id,p.capabilities_receipt_id,p.registered_key_id]
      .every(x=>x===null||/^np-[A-Za-z0-9_-]+$/.test(String(x)))||
    !Number.isSafeInteger(p.issued_at)||!Number.isSafeInteger(p.expires_at)||
    p.issued_at>now||p.expires_at<=now||p.expires_at-p.issued_at>3600000||
    typeof envelope.publicKeyPem!=='string'||!envelope.publicKeyPem.includes('BEGIN PUBLIC KEY')||
    !/^[A-Za-z0-9_-]{86}$/.test(String(envelope.signature||'')))
    return {ok:false,reason:'Unsigned, expired or scope-invalid QL246 packet'};
  return {ok:true,reason:'Shape only. Verify Ed25519 signature AND independently pinned SPKI before acceptance.'};
}
