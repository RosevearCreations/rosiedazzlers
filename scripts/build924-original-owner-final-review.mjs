#!/usr/bin/env node
// Rosie 924 — owner-run signed REVIEW only. Never signs for another owner, certifies hardware or grants connectivity.
import {readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {createPrivateKey,sign,randomUUID} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {OWNER_REVIEW_SCHEMA924} from '../assets/build924-field-authority.mjs';
const hold=m=>{process.stderr.write('ROSIE924_OWNER_REVIEW_HOLD: '+m+'\n');process.exit(2)};
const home=process.env.LOCALAPPDATA,casePath=process.env.ROSEVEAR_ROSIE924_OWNER_CASE_PATH,
 keyPath=process.env.ROSEVEAR_ROSIE924_OWNER_PRIVATE_KEY_PATH,staffId=process.env.ROSEVEAR_ROSIE924_OWNER_STAFF_ID,
 role=process.env.ROSEVEAR_ROSIE924_OWNER_ROLE,commit=process.env.ROSEVEAR_ROSIE924_OWNER_SIGNER_COMMIT;
if(process.platform!=='win32'||!home||!casePath||!keyPath)hold('SEPARATE_TRUSTED_ORIGINAL_OWNER_WINDOWS_DEVICE_REQUIRED');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
let data,key;
try{
 const base=path.resolve(realpathSync(home)).toLowerCase()+path.sep;
 for(const p of [casePath,keyPath])if(!path.resolve(realpathSync(p)).toLowerCase().startsWith(base))hold('OWNER_PRIVATE_FILES_MUST_LIVE_UNDER_LOCALAPPDATA');
 data=JSON.parse(readFileSync(casePath,'utf8'));key=createPrivateKey(readFileSync(keyPath,'utf8'))
}catch{hold('OWNER_PRIVATE_INPUT_INVALID')}
if(key.asymmetricKeyType!=='ed25519'||!UUID.test(staffId||'')||!UUID.test(data.identityWitnessId||'')||
 !/^[a-f0-9]{64}$/.test(data.caseDigestSha256||'')||!['PRIMARY_OWNER','SECOND_OWNER'].includes(role)||
 !/^[a-f0-9]{40}$/.test(commit||''))hold('OWNER_IDENTITY_ROLE_SOURCE_OR_CASE_INVALID');
const observedAtMs=Date.now();
const payload={schema:OWNER_REVIEW_SCHEMA924,ownerStaffId:staffId,ownerRole:role,ownerSignerCommit:commit,reviewId:randomUUID(),
 identityWitnessId:data.identityWitnessId,caseDigestSha256:data.caseDigestSha256,
 decision:data.decision==='APPROVE_REVIEW'?'APPROVE_REVIEW':'HOLD',observedAtMs,expiresAtMs:observedAtMs+120000,
 dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const envelope={payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')};
process.stdout.write(JSON.stringify({envelope})+'\n');
process.stderr.write('SIGNED_OWNER_REVIEW_ONLY: requires independent second owner and physical authority; no field certification.\n');
