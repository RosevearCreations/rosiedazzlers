#!/usr/bin/env node
// Separate GitHub-hosted public-digest-only Ed25519 anchor. No private source or key exported.
import {createPrivateKey,createPublicKey,sign,verify,createHash} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
const title='[Rosie 881] Independently signed original rotation digest anchors';
const endpoint='https://rosiedazzlers.ca/api/roadside_anchor_candidates_v881';
const marker='<!-- rosie881-rotation-anchor:';
const b64url=buf=>Buffer.from(buf).toString('base64url');
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function keyId881(jwk){
 if(jwk?.kty!=='OKP'||jwk.crv!=='Ed25519'||!/^[A-Za-z0-9_-]{43}$/.test(jwk.x||''))
  throw Error('Distinct original Ed25519 anchor public key missing');
 return 'ed25519-sha256:'+b64url(createHash('sha256').update(jwk.x).digest());
}
export function verifyAnchor881(item,pinned){
 const payload=item?.payload;
 if(payload?.schema!=='rosie881-independent-rotation-receipt-anchor-v1'||
  !hex(payload.receipt_sha256)||payload.anchor_public_key_id!==keyId881(pinned)||
  !Number.isFinite(Date.parse(payload.anchored_at))||
  typeof item.signature_ed25519!=='string'||
  !/^[A-Za-z0-9_-]{86}$/.test(item.signature_ed25519))
  return false;
 try{return verify(null,Buffer.from(JSON.stringify(payload)),
   createPublicKey({key:pinned,format:'jwk'}),
   Buffer.from(item.signature_ed25519,'base64url'));}
 catch{return false;}
}
export function anchorComment881(payload,signature){
 return marker+payload.receipt_sha256+' -->\n'+
  JSON.stringify({payload,signature_ed25519:signature})+
  '\n\nMetadata-only, separate GitHub-hosted tamper-evident anchor. NOT WORM or third-party human witnessing.';
}
export function parseAnchorComment881(body){
 const match=typeof body==='string'&&body.match(/^<!-- rosie881-rotation-anchor:([a-f0-9]{64}) -->\n(\{[^\n]+\})/);
 if(!match)return null;
 try{const value=JSON.parse(match[2]);
  return value?.payload?.receipt_sha256===match[1]?value:null;}
 catch{return null;}
}
export async function runAnchor881(){
 const token=process.env.ROSIE881_ANCHOR_JOB_SECRET||'';
 const privateJson=process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||'';
 if(token.length<32||!privateJson||process.env.GITHUB_REPOSITORY!==repo881)
  throw Error('Independent anchor NOT ENROLLED; separate private witness key and job secret required');
 let privateJwk;try{privateJwk=JSON.parse(privateJson);}catch{throw Error('Separate GitHub-held private Ed25519 witness JWK invalid');}
 if(typeof privateJwk?.d!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(privateJwk.d))
  throw Error('Private independent anchor signer not enrolled');
 const key=createPrivateKey({key:privateJwk,format:'jwk'});
 const r=await fetch(endpoint,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
 if(!r.ok)throw Error('Original server anchor candidates unavailable (HTTP '+r.status+')');
 const d=await r.json();
 if(d?.ok!==true||d.build!==881||!Array.isArray(d.receipt_digests)||
  d.receipt_digests.length>25||d.receipt_digests.length!==d.receipt_count||
  d.no_customer_identifiers!==true||d.no_proof_of_actual_key_change!==true||
  d.receipt_digests.some(s=>!hex(s)||d.receipt_digests.indexOf(s)!==d.receipt_digests.lastIndexOf(s)))
  throw Error('Unverified original digest anchor inventory or partial coverage');
 const pinned=d.external_witness_public_jwk;
 const local=createPublicKey(key).export({format:'jwk'});
 if(keyId881(pinned)!==keyId881(local)||pinned.x!==local.x)
  throw Error('Private GitHub signer does not match independently pinned Cloudflare public key');
 if(d.receipt_digests.length===0)throw Error('NO_ORIGINAL_RECEIPTS_HOLD: no real rotation exists to anchor');
 const issue=await originalIssue881(title,
  'Only opaque SHA-256 digests of verified original Supabase owner-supervised rotation readbacks are anchored.\n'+
  'Each comment is Ed25519 signed using a separately enrolled GitHub-held signer and a Cloudflare-pinned public key.\n'+
  'This is a distinct hosted, signed digest record, not immutable WORM retention or a human third-party witness.\n'+
  'No customer names, draft IDs, financial amounts, credentials or actual key rotation are asserted.');
 const prior=await github881('/issues/'+issue.number+'/comments?per_page=100');
 if(!Array.isArray(prior)||prior.length>=100)
  throw Error('Unbounded GitHub external anchor comments; manual archival review required');
 let newCount=0;
 for(const digest of d.receipt_digests){
  const existing=prior.filter(c=>c.body?.startsWith(marker+digest+' -->'));
  if(existing.length>1)throw Error('Duplicate external anchor for an original digest');
  if(existing.length===1){
   const value=parseAnchorComment881(existing[0].body);
   if(!verifyAnchor881(value,pinned))throw Error('Externally hosted receipt signature drift / tamper HOLD');
   continue;
  }
  const payload={schema:'rosie881-independent-rotation-receipt-anchor-v1',
   receipt_sha256:digest,anchor_public_key_id:keyId881(pinned),
   anchored_at:new Date().toISOString()};
  const signature=b64url(sign(null,Buffer.from(JSON.stringify(payload)),key));
  const content=anchorComment881(payload,signature);
  const wrote=await github881('/issues/'+issue.number+'/comments','POST',{body:content});
  if(!wrote?.id)throw Error('Independent GitHub anchor comment not committed');
  const fetched=await github881('/issues/comments/'+wrote.id);
  if(fetched.body!==content||!verifyAnchor881(parseAnchorComment881(fetched.body),pinned))
   throw Error('Original signed GitHub anchor failed exact readback');
  newCount++;
 }
 console.log('Independent external GitHub digest anchors exact-readback verified: '+newCount+
   ' new; '+(d.receipt_count-newCount)+' existing. No original key was rotated.');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 runAnchor881().catch(e=>{console.error('Rosie 881 external anchor: '+e.message);process.exitCode=1;});
