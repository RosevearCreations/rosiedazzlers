#!/usr/bin/env node
// Rosie 923 — owner-run original Windows app protocol challenge, read-only.
// Does not reboot services. No credential exfiltration, automatic acceptance or private customer data.
import os from 'node:os';
import {readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {createPrivateKey,sign,randomUUID} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {APP_HEALTH_SCHEMA922,REQUIRED_SERVICES922} from '../assets/build922-original-application-authority-contract.mjs';
const hold=m=>{process.stderr.write('ROSIE923_ORIGINAL_WINDOWS_HOLD: '+m+'\n');process.exit(2)};
if(process.platform!=='win32')hold('ORIGINAL_WINDOWS_REQUIRED');
const local=process.env.LOCALAPPDATA,configPath=process.env.ROSEVEAR_ROSIE923_ORIGINAL_CONFIG_PATH,keyPath=process.env.ROSEVEAR_ROSIE923_ORIGINAL_PRIVATE_KEY_PATH,challengePath=process.env.ROSEVEAR_ROSIE923_CHALLENGE_PATH;
if(!local||!configPath||!keyPath||!challengePath)hold('PRIVATE_LOCAL_CONFIG_KEY_AND_CHALLENGE_PATHS_REQUIRED');
const root=path.resolve(realpathSync(local)).toLowerCase()+path.sep;
for(const item of [configPath,keyPath,challengePath])if(!path.resolve(realpathSync(item)).toLowerCase().startsWith(root))hold('ALL_FILES_MUST_LIVE_UNDER_ORIGINAL_WINDOWS_LOCALAPPDATA');
let cfg,key,ch;
try{cfg=JSON.parse(readFileSync(configPath,'utf8'));key=createPrivateKey(readFileSync(keyPath,'utf8'));ch=JSON.parse(readFileSync(challengePath,'utf8'))}catch{hold('LOCAL_OWNER_INPUT_INVALID')}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
if(key.asymmetricKeyType!=='ed25519'||cfg.windowsHostName?.toLowerCase()!==os.hostname().toLowerCase()||
 !/^[a-f0-9]{40}$/.test(cfg.samplerCommit||'')||!cfg.hostId||cfg.hostId!==ch.originalHostId||
 !/^[a-f0-9]{32}$/.test(ch.originalBootId||'')||!UUID.test(ch.healthSampleId||'')||!UUID.test(ch.challengeId||'')||
 !/^[a-f0-9]{64}$/.test(ch.challengeNonce||'')||!Number.isSafeInteger(ch.originalSampledAtMs)||Date.parse(ch.expiresAt)<=Date.now()||
 Math.abs(Date.now()-os.uptime()*1000-Number(cfg.originalBootTimeMs))>120000||!Number.isSafeInteger(cfg.originalBootTimeMs))hold('ORIGINAL_BOOT_ID_CHALLENGE_OR_SIGNER_NOT_AUTHORIZED');
if(cfg.originalBootId!==ch.originalBootId||Date.now()-ch.originalSampledAtMs>55000)hold('ORIGINAL_921_SAMPLE_TOO_OLD');
const results=[];
for(const service of REQUIRED_SERVICES922){
 const endpoint=cfg.localProtocolEndpoints?.[service];
 let result={service,state:'UNKNOWN',proof:'NONE'};
 // Only a locally owner-configured 127.0.0.1 HTTP challenge protocol can claim service success.
 if(typeof endpoint==='string'&&/^http:\/\/127\.0\.0\.1:(?:[1-9]\d{1,4})\/v1\/rosevear\/health\/challenge$/.test(endpoint)){
  try{
   const r=await fetch(endpoint+'?nonce='+ch.challengeNonce,{method:'GET',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(1500)});
   if(r.status===200&&(r.headers.get('content-type')||'').startsWith('application/json')){
    const data=await r.text();if(data.length<=512){const parsed=JSON.parse(data);
     if(parsed?.service===service&&parsed?.challengeNonce===ch.challengeNonce&&parsed?.state==='READY')
      result={service,state:'AUTHENTICATED',proof:'HTTP_LOCAL_CHALLENGE'};
    }
   }
  }catch{}
 }
 results.push(result);
}
const now=Date.now();
if(now-ch.originalSampledAtMs>60000||Date.parse(ch.expiresAt)<=now)hold('ORIGINAL_CHALLENGE_EXPIRED_WHILE_PROBING');
const p={schema:APP_HEALTH_SCHEMA922,hostId:ch.originalHostId,bootId:ch.originalBootId,healthSampleId:ch.healthSampleId,attestationId:randomUUID(),
 sampledAtMs:now,issuedAtMs:now,expiresAtMs:now+30000,challengeNonce:ch.challengeNonce,samplerCommit:cfg.samplerCommit,
 serviceResults:results,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
process.stdout.write(JSON.stringify({challengeId:ch.challengeId,envelope:{payload:p,signature:sign(null,Buffer.from(canonical918(p)),key).toString('hex')}})+'\n');
process.stderr.write('SIGNED_APP_OBSERVATION_ONLY. Original Admin must submit envelope immediately. This cannot certify physical boot or service identity independent of local endpoint ownership.\n');
