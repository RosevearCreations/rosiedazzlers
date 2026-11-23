#!/usr/bin/env node
// ORIGINAL WINDOWS ONLY, explicitly supervised, one-off loopback port observations.
// No remote commands, no reboot, no Service Control Manager modification, no customer data.
// The signed JSON lines are REVIEW evidence; a listening port does not prove application health.
import os from 'node:os';
import {readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {createPrivateKey,sign,randomUUID} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {HEALTH_SCHEMA921} from '../assets/build921-live-authority-contract.mjs';
const stop=msg=>{process.stderr.write('ORIGINAL_WINDOWS_SAMPLE_HOLD: '+msg+'\n');process.exit(2)};
if(process.platform!=='win32')stop('WINDOWS_ORIGINAL_HOST_REQUIRED');
const localRoot=process.env.LOCALAPPDATA;
const configPath=process.env.ROSEVEAR_ROSIE921_WINDOWS_LOCAL_CONFIG_PATH;
const keyPath=process.env.ROSEVEAR_ROSIE921_WINDOWS_PRIVATE_KEY_PATH;
if(!localRoot||!configPath||!keyPath)stop('OWNER_ONLY_LOCAL_PATHS_REQUIRED');
const root=path.resolve(realpathSync(localRoot)).toLowerCase()+path.sep;
for(const f of [configPath,keyPath]){const p=path.resolve(realpathSync(f)).toLowerCase();if(!p.startsWith(root))stop('ORIGINAL_KEY_AND_CONFIG_MUST_BE_UNDER_LOCALAPPDATA')}
let cfg,key;
try{cfg=JSON.parse(readFileSync(configPath,'utf8'));key=createPrivateKey(readFileSync(keyPath,'utf8'))}catch{stop('OWNER_ONLY_SIGNING_CONFIG_INVALID')}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(x=>Object.hasOwn(o,x));
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const H40=/^[a-f0-9]{40}$/,H32=/^[a-f0-9]{32}$/;
if(!exact(cfg,['hostReviewId','ceremonyId','hostId','bootId','bootTimeMs','samplerCommit','windowsHostName'])||
 !UUID.test(cfg.hostReviewId)||!UUID.test(cfg.ceremonyId)||!/^[A-Za-z0-9_-]{6,100}$/.test(cfg.hostId)||!H32.test(cfg.bootId)||
 !Number.isSafeInteger(cfg.bootTimeMs)||!H40.test(cfg.samplerCommit)||typeof cfg.windowsHostName!=='string'||
 cfg.windowsHostName.toLowerCase()!==os.hostname().toLowerCase())stop('ORIGINAL_WINDOWS_IDENTITY_OR_BOOT_EVIDENCE_MISMATCH');
if(key.asymmetricKeyType!=='ed25519')stop('ORIGINAL_ED25519_PRIVATE_KEY_REQUIRED');
const args=process.argv.slice(2),only=(flag,def)=>{const i=args.indexOf(flag);if(i<0)return def;return args[i+1]};
if(args.some(x=>!['--samples','--start-seq','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'].includes(x)))stop('ONLY_SAMPLES_AND_START_SEQ_ALLOWED');
const count=Number(only('--samples','1')),startSeq=Number(only('--start-seq','1'));
if(!Number.isSafeInteger(count)||count<1||count>3||!Number.isSafeInteger(startSeq)||startSeq<1||startSeq>9998)stop('SAMPLE_COUNT_OR_SEQUENCE_INVALID');
const observe=port=>new Promise(resolve=>{
 const socket=net.createConnection({host:'127.0.0.1',port});
 let settled=false;
 const done=v=>{if(settled)return;settled=true;socket.destroy();resolve(v)};
 socket.setTimeout(1800,()=>done('UNKNOWN'));
 socket.once('connect',()=>done('LISTENING'));
 socket.once('error',e=>done(e?.code==='ECONNREFUSED'?'NO_LISTENER':'UNKNOWN'));
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
if(Math.abs(Date.now()-os.uptime()*1000-cfg.bootTimeMs)>120000)stop('HOST_BOOT_FROM_OS_UPTIME_NOT_CORRELATED_WITH_ORIGINAL_SIGNED_HOST_REVIEW');
process.stderr.write('Original Windows read-only loopback observation. Do not interpret open ports as verified services or physical certification.\n');
for(let i=0;i<count;i++){
 if(i>0)await sleep(35000);
 const [hubApiPort,caddyPort,mqttPort,ollamaPort]=await Promise.all([observe(8765),observe(8443),observe(1883),observe(11434)]);
 const sampledAtMs=Date.now(),osUptimeSec=Math.floor(os.uptime());
 if(Math.abs(sampledAtMs-cfg.bootTimeMs-osUptimeSec*1000)>120000)stop('ORIGINAL_WINDOWS_UPTIME_BOOT_TIME_DRIFT');
 const p={schema:HEALTH_SCHEMA921,hostReviewId:cfg.hostReviewId,ceremonyId:cfg.ceremonyId,hostId:cfg.hostId,bootId:cfg.bootId,bootTimeMs:cfg.bootTimeMs,
  sampleId:randomUUID(),sampleSeq:startSeq+i,sampledAtMs,osUptimeSec,samplerCommit:cfg.samplerCommit,
  hubApiPort,caddyPort,mqttPort,ollamaPort,collectionMode:'ORIGINAL_WINDOWS_LOOPBACK_READ_ONLY',
  issuedAtMs:Date.now(),expiresAtMs:Date.now()+60000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
 const signature=sign(null,Buffer.from(canonical918(p)),key).toString('hex');
 process.stdout.write(JSON.stringify({payload:p,signature})+'\n');
}
process.stderr.write('SIGNED_ORIGINAL_WINDOWS_READ_ONLY_OBSERVATION_COMPLETE. Original Admin must admit each envelope while fresh; never paste the private key.\n');
