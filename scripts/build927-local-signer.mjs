#!/usr/bin/env node
// Invoked only by the ACL-protecting PowerShell wrapper. No key overwrite or network.
import path from 'node:path';
import {readFileSync,writeFileSync,realpathSync,existsSync} from 'node:fs';
import {generateKeyPairSync,createPrivateKey,createPublicKey,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const fail=m=>{process.stderr.write('ROSIE927_HOLD: '+m+'\n');process.exit(2)};
try{
 const [role,staffId,dir,mode]=process.argv.slice(2);
 if(process.platform!=='win32'||!['PHYSICAL_WITNESS','RUNTIME_INSPECTOR','CERTIFICATION_AUTHORITY'].includes(role)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(staffId||'')||!['Inspect','Create'].includes(mode))fail('ROLE_STAFF_ID_AND_MODE_REQUIRED');
 const root=path.resolve(realpathSync(process.env.LOCALAPPDATA)).toLowerCase()+path.sep;
 const folder=realpathSync(dir);if(!path.resolve(folder).toLowerCase().startsWith(root))fail('PRIVATE_DIRECTORY_REQUIRED');
 const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim();
 if(!/^[a-f0-9]{40}$/.test(sourceCommit)||execFileSync('git',['status','--porcelain'],{encoding:'utf8',windowsHide:true}).trim())fail('CLEAN_APPROVED_CHECKOUT_REQUIRED');
 const keyPath=path.join(folder,'signer.pem'),configPath=path.join(folder,'config.json');
 if(mode==='Create'){
  if(existsSync(keyPath)||existsSync(configPath))fail('EXISTING_KEY_OR_CONFIG_NOT_OVERWRITTEN');
  const k=generateKeyPairSync('ed25519');
  writeFileSync(keyPath,k.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});
  writeFileSync(configPath,JSON.stringify({role,staffId,sourceCommit},null,2)+'\n',{flag:'wx',mode:0o600});
 }
 if(!existsSync(keyPath)||!existsSync(configPath))fail('EXISTING_LOCAL_KEY_AND_CONFIG_REQUIRED');
 for(const f of [keyPath,configPath])if(path.dirname(realpathSync(f)).toLowerCase()!==folder.toLowerCase())fail('UNSAFE_PRIVATE_FILE_LOCATION');
 const c=JSON.parse(readFileSync(configPath,'utf8'));if(c.role!==role||c.staffId!==staffId)fail('EXISTING_ROLE_MISMATCH');
 const k=createPrivateKey(readFileSync(keyPath,'utf8'));if(k.asymmetricKeyType!=='ed25519')fail('WRONG_KEY_TYPE');
 const der=createPublicKey(k).export({type:'spki',format:'der'});
 console.log(JSON.stringify({role,staffId,expectedCommit:sourceCommit,fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64'),state:'PUBLIC_PIN_PROPOSAL_NOT_ENROLLED',localConfigRevisionMatches:c.sourceCommit===sourceCommit},null,2));
}catch{fail('LOCAL_SIGNER_SETUP_FAILED_NO_AUTOMATIC_ROTATION')}
