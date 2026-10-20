/** Build 582 — AWS S3 Object Lock COMPLIANCE adapter (AWS CLI v2, OIDC credentials).
 * Fail closed if bucket/versioning/object-lock/account are not independently verified.
 * No credentials are stored here and no storage configuration is created implicitly.
 */
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdtemp,writeFile,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

const exec=promisify(execFile);
const ACCOUNT=/^\d{12}$/;
const BUCKET=/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const REGION=/^[a-z]{2}(?:-[a-z]+)+-\d$/;
const KEY=/^[A-Za-z0-9][A-Za-z0-9._/-]{2,180}$/;
const DAY=86400000;

export function wormConfig(env) {
  const cfg={bucket:env.RD_WORM_BUCKET,region:env.RD_WORM_REGION,
    account:env.RD_WORM_ACCOUNT_ID,retentionDays:Number(env.RD_WORM_RETENTION_DAYS||90)};
  if(!BUCKET.test(cfg.bucket||"")||!REGION.test(cfg.region||"")||
    !ACCOUNT.test(cfg.account||"")||!Number.isInteger(cfg.retentionDays)||
    cfg.retentionDays<30||cfg.retentionDays>3650)
    throw Error("WORM bucket/region/account/retention not fully configured: HOLD");
  return cfg;
}
export async function awsCli(args){
  const {stdout}=await exec("aws",[...args,"--no-cli-pager","--output","json"],
    {timeout:30000,maxBuffer:1024*1024});
  try{return stdout.trim()?JSON.parse(stdout):{};}
  catch{throw Error("AWS CLI returned non-JSON response");}
}
export function s3ComplianceAdapter({config,run=awsCli,now=()=>new Date()}) {
  if(!config||!BUCKET.test(config.bucket||"")||!ACCOUNT.test(config.account||"")||
     !REGION.test(config.region||"")||!Number.isInteger(config.retentionDays)||
     config.retentionDays<30||config.retentionDays>3650) throw Error("Invalid S3 WORM adapter configuration");
  const {bucket,region,account,retentionDays}=config;
  const prefix=["--region",region];
  const s3=(command,args=[])=>run(["s3api",command,...args,...prefix]);
  const b=["--bucket",bucket,"--expected-bucket-owner",account];
  const versions=new Map();
  let ready=false;
  async function ensureReady(){
    const caller=await run(["sts","get-caller-identity",...prefix]);
    if(caller?.Account!==account) throw Error("AWS assumed account is not the independent WORM owner: HOLD");
    const [lock,versioning]=await Promise.all([
      s3("get-object-lock-configuration",b),
      s3("get-bucket-versioning",b)
    ]);
    if(lock?.ObjectLockConfiguration?.ObjectLockEnabled!=="Enabled"||
       versioning?.Status!=="Enabled") throw Error("S3 Object Lock or versioning is not enabled: HOLD");
    ready=true;
    return {bucket,region,retentionMode:"COMPLIANCE",retentionDays};
  }
  async function getVersion(key){
    const head=await s3("head-object",[...b,"--key",key]);
    if(!head?.VersionId) throw Error("S3 immutable object VersionId unavailable: HOLD");
    return head.VersionId;
  }
  async function verifyLock(key,version,minimumUntil=now().getTime()){
    const lock=await s3("get-object-retention",[...b,"--key",key,"--version-id",version]);
    const mode=lock?.Retention?.Mode;
    const until=Date.parse(lock?.Retention?.RetainUntilDate||"");
    if(mode!=="COMPLIANCE"||!Number.isFinite(until)||until<minimumUntil)
      throw Error("S3 object version is not locked in COMPLIANCE mode: HOLD");
  }
  async function createOnce(key,value){
    if(!ready) await ensureReady();
    if(!KEY.test(key||"")) throw Error("Invalid immutable object key");
    const dir=await mkdtemp(join(tmpdir(),"rd-worm-"));
    const filename=join(dir,"snapshot.json");
    try{
      await writeFile(filename,JSON.stringify(value),{mode:0o600});
      const until=new Date(now().getTime()+retentionDays*DAY).toISOString();
      const put=await s3("put-object",[...b,"--key",key,"--body",filename,
        "--content-type","application/json","--if-none-match","*",
        "--object-lock-mode","COMPLIANCE","--object-lock-retain-until-date",until]);
      if(!put?.VersionId) throw Error("Object Lock upload gave no VersionId: HOLD");
      versions.set(key,put.VersionId);
      await verifyLock(key,put.VersionId,Date.parse(until)-60000);
      return {created:true,versionId:put.VersionId};
    }finally{await rm(dir,{recursive:true,force:true});}
  }
  async function read(key){
    if(!ready) await ensureReady();
    if(!KEY.test(key||"")) throw Error("Invalid immutable object key");
    const version=versions.get(key)||await getVersion(key);
    await verifyLock(key,version);
    const dir=await mkdtemp(join(tmpdir(),"rd-worm-"));
    const filename=join(dir,"snapshot.json");
    try{
      await s3("get-object",[...b,"--key",key,"--version-id",version,filename]);
      return JSON.parse(await readFile(filename,"utf8"));
    }finally{await rm(dir,{recursive:true,force:true});}
  }
  return {capabilities:{immutableCreate:true,retentionLock:true,independentTrustRoot:true},
    ensureReady,createOnce,read};
}
