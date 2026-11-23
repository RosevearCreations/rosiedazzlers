#!/usr/bin/env node
// Rosie 924 — original Windows-only one-shot SCM witness. Does not start/stop services.
// Its independent inspector key must differ from Rosie 923's application signer.
import os from 'node:os';
import path from 'node:path';
import {realpathSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createPrivateKey,sign,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {IDENTITY_SCHEMA924} from '../assets/build924-field-authority.mjs';
const fail=m=>{process.stderr.write('ROSIE924_ORIGINAL_HOLD: '+m+'\n');process.exit(2)};
if(process.platform!=='win32')fail('ORIGINAL_WINDOWS_REQUIRED');
const root=process.env.LOCALAPPDATA,configPath=process.env.ROSEVEAR_ROSIE924_CONFIG_PATH,
 keyPath=process.env.ROSEVEAR_ROSIE924_INSPECTOR_PRIVATE_KEY_PATH,challengePath=process.env.ROSEVEAR_ROSIE924_CHALLENGE_PATH;
if(!root||!configPath||!keyPath||!challengePath)fail('ORIGINAL_OWNER_PRIVATE_FILES_REQUIRED');
let cfg,ch,key;
try{
 const base=path.resolve(realpathSync(root)).toLowerCase()+path.sep;
 for(const x of [configPath,keyPath,challengePath])if(!path.resolve(realpathSync(x)).toLowerCase().startsWith(base))fail('ONLY_ORIGINAL_LOCALAPPDATA_ALLOWED');
 cfg=JSON.parse(readFileSync(configPath,'utf8'));ch=JSON.parse(readFileSync(challengePath,'utf8'));
 key=createPrivateKey(readFileSync(keyPath,'utf8'));
}catch{fail('ORIGINAL_PRIVATE_FILES_INVALID')}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
if(key.asymmetricKeyType!=='ed25519'||cfg.windowsHostName?.toLowerCase()!==os.hostname().toLowerCase()||
 !/^[a-f0-9]{40}$/.test(cfg.inspectorCommit||'')||!UUID.test(ch.appAttestationId||'')||
 !UUID.test(ch.challengeId||'')||!/^[a-f0-9]{64}$/.test(ch.challengeNonce||'')||
 !/^[a-f0-9]{32}$/.test(ch.bootId||'')||ch.hostId!==cfg.hostId||
 Date.parse(ch.expiresAt)<=Date.now()||Date.parse(ch.expiresAt)-Date.now()>90000||
 !['hub','caddy','mqtt','ollama'].every(x=>/^[A-Za-z0-9_.-]{1,80}$/.test(cfg.serviceNames?.[x]||'')))
 fail('ORIGINAL_INSPECTOR_OR_CHALLENGE_BINDING_INVALID');
let services;
try{
 const script=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'build924-original-windows-service-inspection.ps1');
 const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','RemoteSigned','-File',script,'-ConfigurationPath',realpathSync(configPath)],{
  encoding:'utf8',timeout:15000,maxBuffer:10000,windowsHide:true});
 services=JSON.parse(output);
 if(!Array.isArray(services)||services.length!==4||services.some((s,i)=>s.service!==['hub','caddy','mqtt','ollama'][i]))throw Error('SHAPE');
}catch{fail('ORIGINAL_WINDOWS_SERVICE_CONTROL_MANAGER_INSPECTION_FAILED')}
const observedAtMs=Date.now();
if(Date.parse(ch.expiresAt)<=observedAtMs)fail('CHALLENGE_EXPIRED_DURING_INSPECTION');
const payload={schema:IDENTITY_SCHEMA924,hostId:ch.hostId,bootId:ch.bootId,
 sourceAttestationId:ch.appAttestationId,inspectionId:randomUUID(),challengeNonce:ch.challengeNonce,
 inspectorCommit:cfg.inspectorCommit,observedAtMs,expiresAtMs:Math.min(observedAtMs+30000,Date.parse(ch.expiresAt)),
 services,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
process.stdout.write(JSON.stringify({challengeId:ch.challengeId,envelope:{payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')}})+'\n');
process.stderr.write('SIGNED_WINDOWS_SCM_OBSERVATION_ONLY. Independent original owner, provider and physical review remain required; no field certification.\n');
