#!/usr/bin/env node
/**
 * QL-256 trusted-machine operator utility, NOT a CI provisioning command.
 * Creates a real app-specific Ed25519 key in a caller-owned persistent PRIVATE
 * directory or answers a separately supplied short-lived nonce challenge.
 * It never publishes a source proof, authorizes a trial or attests human identity.
 */
import {generateKeyPairSync,createPrivateKey,createPublicKey,sign,verify,createHash}
  from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,lstatSync,realpathSync,statSync}
  from 'node:fs';
import {resolve,isAbsolute,relative,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO=realpathSync(fileURLToPath(new URL('../',import.meta.url)));
const SHA=/^[a-f0-9]{40}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const NONCE=/^np-[A-Za-z0-9_-]{12,80}$/;
const HEX=/^[a-f0-9]{64}$/;
const CUSTODY_FILE='rosie-ql256-source-signer.private.pem';
const PUBLIC_FILE='rosie-ql256-source-signer.public.pem';
const POLICY='Owner-controlled private storage, separate authenticated custodian and witness still required';
const sha256=b=>createHash('sha256').update(b).digest('hex');
function args(argv){
  const [action,...rest]=argv;if(!['provision','inspect','respond'].includes(action))
    throw Error('Usage: node scripts/ql256_rosie_signer_custody.mjs provision|inspect|respond --custody-dir ABSOLUTE_PATH [--challenge-file ABSOLUTE_PATH --response-file ABSOLUTE_PATH]');
  if(rest.length%2)throw Error('Options must be name/value pairs');
  const options={};for(let i=0;i<rest.length;i+=2){
    const k=rest[i],v=rest[i+1];
    if(!['--custody-dir','--challenge-file','--response-file'].includes(k)||
      Object.hasOwn(options,k)||typeof v!=='string'||!isAbsolute(v))
      throw Error('Only explicit absolute custody/challenge/response paths are accepted');
    options[k]=resolve(v);
  }
  if(!options['--custody-dir'])throw Error('Missing --custody-dir');
  const needed=action==='respond';
  if(needed!==!!options['--challenge-file']||needed!==!!options['--response-file'])
    throw Error('Challenge and response file paths are required only for respond');
  return {action,options};
}
function outsideRepo(path){
  const parent=realpathSync(dirname(path));
  const actual=resolve(parent,path.split(/[\\/]/).at(-1));
  const delta=relative(REPO,actual);
  if(delta===''||(!delta.startsWith('..')&&!isAbsolute(delta)))
    throw Error('Custody path must be outside this GitHub repository');
}
function privateDirectory(path,create=false){
  outsideRepo(path);
  if(create){if(existsSync(path))throw Error('Custody directory already exists; refusing overwrite');
    mkdirSync(path,{recursive:false,mode:0o700});}
  if(lstatSync(path).isSymbolicLink()||!statSync(path).isDirectory())
    throw Error('Custody directory must be real, not a symlink');
  if(process.platform!=='win32'&&(statSync(path).mode&0o077)!==0)
    throw Error('Custody directory allows group/other access; refuse');
}
function readKeypair(dir){
  privateDirectory(dir);
  const privatePath=join(dir,CUSTODY_FILE),publicPath=join(dir,PUBLIC_FILE);
  if(lstatSync(privatePath).isSymbolicLink()||lstatSync(publicPath).isSymbolicLink())
    throw Error('Signer files must not be symlinks');
  if(process.platform!=='win32'&&(statSync(privatePath).mode&0o077)!==0)
    throw Error('Private signer key is readable by group/other; refuse');
  const privateKey=createPrivateKey(readFileSync(privatePath));
  if(privateKey.asymmetricKeyType!=='ed25519')throw Error('Signer key must be Ed25519');
  const publicKey=createPublicKey(readFileSync(publicPath));
  if(publicKey.asymmetricKeyType!=='ed25519')throw Error('Public signer key must be Ed25519');
  const spki=publicKey.export({format:'der',type:'spki'});
  const derived=createPublicKey(privateKey).export({format:'der',type:'spki'});
  if(!spki.equals(derived))throw Error('Public/private key mismatch');
  return {privateKey,publicKey,spki,publicSpkiSha256:sha256(spki)};
}
export function validateChallenge(c,now=Date.now()){
  if(!c||typeof c!=='object'||Array.isArray(c)||
    Object.keys(c).sort().join(',')!==[
      'business_id','challenge_id','ci_run_url','environment','expires_at',
      'issued_at','nonce','repository','source_sha_A','tenant_id'
    ].sort().join(',')||
    c.business_id!=='rosiedazzlers'||c.repository!=='RosevearCreations/rosiedazzlers'||
    c.environment!=='nonproduction'||c.tenant_id!==null||
    !SHA.test(String(c.source_sha_A||''))||!CI.test(String(c.ci_run_url||''))||
    !NONCE.test(String(c.challenge_id||''))||
    !/^[A-Za-z0-9_-]{24,200}$/.test(String(c.nonce||''))||
    !Number.isSafeInteger(c.issued_at)||!Number.isSafeInteger(c.expires_at)||
    c.issued_at>now||c.expires_at<=now||c.expires_at-c.issued_at>300000)
    throw Error('Invalid/expired independent QL-256 challenge; private reviewer must renew');
  return {schema:'rosie.ql256.key_possession_response.v1',
    repository:c.repository,source_sha_A:c.source_sha_A,ci_run_url:c.ci_run_url,
    business_id:c.business_id,tenant_id:null,environment:c.environment,
    challenge_id:c.challenge_id,nonce_sha256:sha256(c.nonce),
    issued_at:c.issued_at,expires_at:c.expires_at};
}
export function signPossessionResponse(challenge,keyPair,now=Date.now()){
  const claims=validateChallenge(challenge,now);
  const bytes=Buffer.from(JSON.stringify(claims),'utf8');
  const signature=sign(null,bytes,keyPair.privateKey).toString('base64url');
  if(!verify(null,bytes,keyPair.publicKey,Buffer.from(signature,'base64url')))
    throw Error('Local Ed25519 self-verification failed');
  return {claims,publicKeyPem:keyPair.publicKey.export({format:'pem',type:'spki'}),
    public_spki_sha256:keyPair.publicSpkiSha256,signature,
    local_signature_verified:true,
    real_world_custody_verified:false,independent_witness_verified:false,
    independently_pinned_public_key_verified:false,
    original_signed_ql246_proof_published:false,owner_test_authorization:'NOT_GIVEN',
    connection_state:'DISCONNECTED'};
}
export function perform(argv){
  const {action,options}=args(argv),dir=options['--custody-dir'];
  if(action==='provision'){
    privateDirectory(dir,true);
    const {privateKey,publicKey}=generateKeyPairSync('ed25519');
    const privatePem=privateKey.export({type:'pkcs8',format:'pem'});
    const publicPem=publicKey.export({type:'spki',format:'pem'});
    writeFileSync(join(dir,CUSTODY_FILE),privatePem,{flag:'wx',mode:0o600});
    writeFileSync(join(dir,PUBLIC_FILE),publicPem,{flag:'wx',mode:0o600});
  }
  const keys=readKeypair(dir);
  const report={application_name:'Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',
    local_signer_status:'SIGNER_EXISTS_CUSTODY_NOT_VERIFIED',
    public_spki_sha256:keys.publicSpkiSha256,private_key_contents:'NEVER_EXPORTED',
    private_custodian_origin:'NOT_INDEPENDENTLY_VERIFIED',
    independent_witness:'NOT_ASSIGNED',owner_test_decision:'NOT_GIVEN',
    original_signed_proof:'NOT_PUBLISHED',connection_state:'DISCONNECTED',
    next_action:POLICY};
  if(action==='respond'){
    const challengePath=options['--challenge-file'],responsePath=options['--response-file'];
    // The nonce-bearing challenge and signed response belong to private custody,
    // never any repository path that might accidentally enter a public commit.
    outsideRepo(challengePath);outsideRepo(responsePath);
    if(challengePath===responsePath||responsePath.startsWith(dir+'/')||responsePath.startsWith(dir+'\\'))
      throw Error('Response must not overwrite challenge or be stored with private signer material');
    const challenge=JSON.parse(readFileSync(challengePath,'utf8'));
    const response=signPossessionResponse(challenge,keys);
    writeFileSync(responsePath,JSON.stringify(response,null,2)+'\n',{flag:'wx',mode:0o600});
    report.response_written=true;report.response_claim_sha256=sha256(JSON.stringify(response.claims));
  }
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(perform(process.argv.slice(2)),null,2)+'\n');}
  catch(e){process.stderr.write(`QL-256 signer action blocked: ${e.message}\n`);process.exitCode=1;}
}
