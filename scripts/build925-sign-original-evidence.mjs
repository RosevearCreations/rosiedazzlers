#!/usr/bin/env node
// Owner-operated signer. Private keys never leave the original trusted local device.
import os from 'node:os';
import path from 'node:path';
import {realpathSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createPrivateKey,sign} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {digest925} from '../assets/build925-field-reconciliation.mjs';
const fail=()=>{process.stderr.write('ROSIE925_SIGNING_HOLD: invalid private files, original identity, case, or explicit decision. No signature issued.\n');process.exit(2)};
try{
 if(process.platform!=='win32'||!process.env.LOCALAPPDATA)fail();
 const root=path.resolve(realpathSync(process.env.LOCALAPPDATA)).toLowerCase()+path.sep;
 function privateFile(p){const q=realpathSync(p);if(!path.resolve(q).toLowerCase().startsWith(root))fail();return q}
 const cfgPath=privateFile(process.env.ROSEVEAR_ROSIE925_SIGNER_CONFIG_PATH),cfg=JSON.parse(readFileSync(cfgPath,'utf8'));
 const input=JSON.parse(readFileSync(privateFile(process.env.ROSEVEAR_ROSIE925_CASE_INPUT_PATH),'utf8'));
 const key=createPrivateKey(readFileSync(privateFile(process.env.ROSEVEAR_ROSIE925_PRIVATE_KEY_PATH),'utf8'));
 const {role,staffId,sourceCommit}=cfg,binding=input.binding;
 if(key.asymmetricKeyType!=='ed25519'||!['INSPECTOR','PHYSICAL_WITNESS','PRIMARY_OWNER','SECOND_OWNER','PRODUCTION_WITNESS'].includes(role)||!/^[a-f0-9-]{36}$/i.test(staffId)||!/^[a-f0-9]{40}$/.test(sourceCommit)||!binding||!/^[a-f0-9]{64}$/.test(binding.nonce||''))fail();
 const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),windowsHide:true}).trim();if(commit!==sourceCommit)fail();
 const cd=await digest925(binding);let evidence,caseDigest=cd;
 if(role==='INSPECTOR'){
 if(cfg.windowsHostName?.toLowerCase()!==os.hostname().toLowerCase()||cfg.hostId!==binding.hostId||cfg.originalBootId!==binding.bootId||!Number.isSafeInteger(cfg.originalBootTimeMs))fail();
 const ps=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'build925-windows-identities.ps1');
 const observations=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','RemoteSigned','-File',ps,'-ConfigurationPath',cfgPath],{encoding:'utf8',timeout:30000,maxBuffer:20000,windowsHide:true}));
 if(!Array.isArray(observations)||observations.length!==4)fail();evidence={observations};
 }else if(role==='PHYSICAL_WITNESS'){
 if(!['APPROVE','HOLD'].includes(input.decision)||!input.inspector||!['IN_PERSON','NOT_PRESENT'].includes(input.presence)||typeof input.observedRecovery!=='boolean')fail();
 if(input.decision==='APPROVE'&&(input.presence!=='IN_PERSON'||!input.observedRecovery))fail();
 evidence={inspectionDigest:await digest925(input.inspector),presence:input.presence,observedRecovery:input.observedRecovery,decision:input.decision};
 }else if(role==='PRODUCTION_WITNESS'){
 if(!input.deploymentId||input.productionSha!==binding.productionSha||!['PASS','FAIL'].includes(input.canonicalSmoke)||!['SUCCESS','FAILURE'].includes(input.providerStatus))fail();
 evidence={deploymentId:input.deploymentId,productionSha:input.productionSha,canonicalSmoke:input.canonicalSmoke,providerStatus:input.providerStatus};
 }else{
 if(!['APPROVE','HOLD'].includes(input.decision)||!input.inspector||!input.physical||!input.production)fail();
 caseDigest=await digest925({caseDigest:cd,inspectionDigest:await digest925(input.inspector),physical:await digest925(input.physical),production:await digest925(input.production)});
 evidence={decision:input.decision};
 }
 // Non-inspector roles must explicitly acknowledge their personal review on the command line.
 if(role!=='INSPECTOR'&&!process.argv.includes('--confirm-my-original-review'))fail();
 const observedAtMs=Date.now(),payload={schema:'rosevear.rosie.field-evidence.v925',role,staffId,sourceCommit,caseDigest,observedAtMs,expiresAtMs:observedAtMs+120000,evidence,authorizesAction:false};
 process.stdout.write(JSON.stringify({payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')})+'\n');
}catch{fail()}
