#!/usr/bin/env node
// Explicitly user-operated. No secrets in output, no network requests, no automated witness.
import os from 'node:os';
import path from 'node:path';
import {realpathSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createPrivateKey,createPublicKey,createHash,sign} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {digest925} from '../assets/build925-field-reconciliation.mjs';
const hold=()=>{process.stderr.write('ROSIE926_HOLD: verify local Windows identity, approved revision, private inputs and explicit decision. No signature issued.\n');process.exit(2)};
try{
 if(process.platform!=='win32'||!process.env.LOCALAPPDATA)hold();
 const root=path.resolve(realpathSync(process.env.LOCALAPPDATA)).toLowerCase()+path.sep;
 function local(p){const q=realpathSync(p);if(!path.resolve(q).toLowerCase().startsWith(root))hold();return q}
 const cfgPath=local(process.env.ROSEVEAR_ROSIE926_CONFIG_PATH),cfg=JSON.parse(readFileSync(cfgPath,'utf8'));
 const key=createPrivateKey(readFileSync(local(process.env.ROSEVEAR_ROSIE926_PRIVATE_KEY_PATH),'utf8'));
 const {role,staffId,sourceCommit}=cfg;
 const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
 if(key.asymmetricKeyType!=='ed25519'||!['PHYSICAL_WITNESS','RUNTIME_INSPECTOR','CERTIFICATION_AUTHORITY'].includes(role)||!/^[a-f0-9-]{36}$/i.test(staffId)||! /^[a-f0-9]{40}$/.test(sourceCommit)||commit!==sourceCommit)hold();
 if(process.argv.includes('--public-pin')){
 const der=createPublicKey(key).export({type:'spki',format:'der'});
 console.log(JSON.stringify({role,staffId,expectedCommit:sourceCommit,fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64')}));process.exit(0);
 }
 const input=JSON.parse(readFileSync(local(process.env.ROSEVEAR_ROSIE926_INPUT_PATH),'utf8')),b=input.binding;
 if(!b||!/^[a-f0-9]{64}$/.test(b.nonce||''))hold();
 let bindingDigest=await digest925(b),evidence;
 if(role==='PHYSICAL_WITNESS'){
 if(!process.argv.includes('--confirm-my-enrollment')||b.staffId!==staffId||b.fingerprint!==createHash('sha256').update(createPublicKey(key).export({type:'spki',format:'der'})).digest('hex'))hold();
 evidence={decision:'ENROLL'};
 }else if(role==='RUNTIME_INSPECTOR'){
 if(cfg.windowsHostName?.toLowerCase()!==os.hostname().toLowerCase()||cfg.hostId!==b.hostId||cfg.originalBootId!==b.bootId||!Number.isSafeInteger(cfg.originalBootTimeMs))hold();
 const ps=path.resolve(repo,'scripts','build926-windows-runtime.ps1');
 const observations=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','RemoteSigned','-File',ps,'-Mode','Attest','-ConfigurationPath',cfgPath],{encoding:'utf8',timeout:45000,maxBuffer:24000,windowsHide:true}));
 if(!Array.isArray(observations)||observations.length!==4)hold();evidence={observations};
 }else{
 if(!process.argv.includes('--confirm-my-certification')||!['APPROVE','HOLD'].includes(input.decision)||!input.runtime)hold();
 bindingDigest=await digest925({bindingDigest,runtimeDigest:await digest925(input.runtime)});
 evidence={decision:input.decision,scope:'ORIGINAL_HOST_RUNTIME_AT_OBSERVATION'};
 }
 const issuedAtMs=Date.now(),payload={schema:'rosevear.rosie.original.v926',role,staffId,sourceCommit,bindingDigest,issuedAtMs,expiresAtMs:issuedAtMs+120000,evidence,authorizesAction:false};
 console.log(JSON.stringify({payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')}));
}catch{hold()}
