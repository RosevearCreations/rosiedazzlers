#!/usr/bin/env node
// Explicit local independent human witness signing. Never manufactures or collects evidence.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createPrivateKey,createPublicKey,createHash,sign} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {digest925} from '../assets/build925-field-reconciliation.mjs';
import {roles930} from '../assets/build930-signed-guest-custody.mjs';
try{
 if(process.platform!=='win32'||!process.env.LOCALAPPDATA)throw Error();
 const root=realpathSync(process.env.LOCALAPPDATA).toLowerCase()+path.sep;
 const read=(p,max)=>{const f=realpathSync(p);if(!f.toLowerCase().startsWith(root)||statSync(f).size>max)throw Error();return readFileSync(f,'utf8')};
 const cfg=JSON.parse(read(process.env.ROSEVEAR_ROSIE930_SIGNER_CONFIG,16000)),key=createPrivateKey(read(process.env.ROSEVEAR_ROSIE930_PRIVATE_KEY,16000));
 const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
 if(key.asymmetricKeyType!=='ed25519'||!roles930.includes(cfg.role)||! /^[a-f0-9-]{36}$/i.test(cfg.staffId)||cfg.sourceCommit!==commit||! /^[a-f0-9]{40}$/.test(commit))throw Error();
 const der=createPublicKey(key).export({type:'spki',format:'der'});
 if(process.argv.includes('--public-pin')){console.log(JSON.stringify({staffId:cfg.staffId,expectedCommit:commit,fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64')}));process.exit(0)}
 if(!process.argv.includes('--confirm-independent-observation'))throw Error();
 const input=JSON.parse(read(process.env.ROSEVEAR_ROSIE930_INPUT,45000)),binding=input.binding;
 if(!binding||! /^[a-f0-9]{64}$/.test(binding.nonce)||!input.evidence)throw Error();
 let bindingDigest=await digest925(binding);
 if(cfg.role==='CUSTODY_AUTHORITY'){if(!input.guest||!input.launcher)throw Error();bindingDigest=await digest925({bindingDigest,guestDigest:await digest925(input.guest),launcherDigest:await digest925(input.launcher)})}
 const issuedAtMs=Date.now(),payload={schema:'rosevear.rosie.original.v926',role:cfg.role,staffId:cfg.staffId,sourceCommit:commit,bindingDigest,issuedAtMs,expiresAtMs:issuedAtMs+120000,evidence:input.evidence,authorizesAction:false};
 console.log(JSON.stringify({payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')}));
}catch{process.stderr.write('ROSIE930_HOLD: independently reviewed source evidence and private local signer required. No signature issued.\n');process.exit(2)}
