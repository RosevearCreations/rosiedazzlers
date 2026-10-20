/** Build 587: independently pinned external rotation register reconciliation.
 * Read-only. An HTTPS document alone, GitHub issue comments, or a supplied "verified"
 * boolean never prove independence. Verification requires an Ed25519 signature, a
 * separately trusted signing-key fingerprint, a separately pinned register digest,
 * and signed Build 586 handoff packages for every receipt.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {crossAnchorHistory,reconcileCrossAnchorProofHistory} from "./release_incident_rotation_handoff_receipts.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=250;
const columns=["commentId","receiptDigest","priorDigest","successorDigest","evidenceDigest",
  "approvalRef","priorVersionId","successorVersionId"];
const registerFields=["schema","repository","issueNumber","sequence","previousRegisterDigest",
  "headDigest","receiptCount","entries","issuedAt","registerRef"];
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value!==null&&typeof value==="object")return Object.fromEntries(
    Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
export const canonicalBytes=value=>Buffer.from(JSON.stringify(canonical(value)));
export const digestRegister=value=>createHash("sha256").update(canonicalBytes(value)).digest("hex");
function dateTime(value){
  if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||
      new Date(value).toISOString()!==value)
    throw Error("Canonical register issue timestamp required: HOLD");
  return Date.parse(value);
}
function verifyShape(value){
  if(!value||typeof value!=="object"||Array.isArray(value)||
     Object.keys(value).sort().join(",")!==registerFields.slice().sort().join(",")||
     value.schema!=="rosie.external-rotation-register.v1"||
     value.repository!=="RosevearCreations/rosiedazzlers"||
     !Number.isSafeInteger(value.issueNumber)||value.issueNumber<1||
     !Number.isSafeInteger(value.sequence)||value.sequence<1||
     !(value.previousRegisterDigest===null||SHA.test(value.previousRegisterDigest||""))||
     !SHA.test(value.headDigest||"")||
     !Number.isSafeInteger(value.receiptCount)||value.receiptCount<1||value.receiptCount>MAX||
     !Array.isArray(value.entries)||value.entries.length!==value.receiptCount||
     !REF.test(value.registerRef||""))
     throw Error("External register schema, identity or count invalid: HOLD");
  dateTime(value.issuedAt);
  let last=0;
  for(const entry of value.entries){
    if(!entry||typeof entry!=="object"||Array.isArray(entry)||
       Object.keys(entry).sort().join(",")!==columns.slice().sort().join(",")||
       !Number.isSafeInteger(entry.commentId)||entry.commentId<=last||
       !SHA.test(entry.receiptDigest||"")||!SHA.test(entry.priorDigest||"")||
       !SHA.test(entry.successorDigest||"")||!SHA.test(entry.evidenceDigest||"")||
       !REF.test(entry.approvalRef||"")||
       typeof entry.priorVersionId!=="string"||!entry.priorVersionId||
       typeof entry.successorVersionId!=="string"||!entry.successorVersionId)
      throw Error("External register has missing or unordered receipt identity: HOLD");
    last=entry.commentId;
  }
  if(value.entries.at(-1).receiptDigest!==value.headDigest)
    throw Error("Register head does not equal last receipt digest: HOLD");
  return value;
}
function independentlyPinned(pin,registerDigest,register){
  if(!pin||!SHA.test(pin.registerDigest||"")||
     !SHA.test(pin.headDigest||"")||!REF.test(pin.externalReference||"")||
     !Number.isSafeInteger(pin.sequence)||pin.sequence<1||
     pin.registerDigest!==registerDigest||
     pin.headDigest!==register.headDigest||pin.sequence!==register.sequence)
    throw Error("Separately controlled exact register/head pin unavailable or mismatched: HOLD");
}
export function verifyExternalRotationRegister({
  signedRegister,publicKeyPem,trustedFingerprint,externalPin,previousPin=null,now=new Date()
}){
  if(!signedRegister||signedRegister.algorithm!=="Ed25519"||
     typeof signedRegister.signature!=="string"||
     !SHA.test(trustedFingerprint||""))
    throw Error("Signed external register and independently pinned signing key required: HOLD");
  const record=verifyShape(signedRegister.register);
  const currentTime=new Date(now).getTime(),issued=dateTime(record.issuedAt);
  if(!Number.isFinite(currentTime)||issued>currentTime+300000)
    throw Error("External register issue time invalid or in future: HOLD");
  if(typeof publicKeyPem!=="string"||publicKeyPem.length>8192)
    throw Error("External Ed25519 key unavailable: HOLD");
  const key=createPublicKey(publicKeyPem);
  if(key.asymmetricKeyType!=="ed25519")
    throw Error("External register must use Ed25519: HOLD");
  const fingerprint=createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex");
  if(fingerprint!==trustedFingerprint)
    throw Error("Independently pinned external signing-key fingerprint mismatch: HOLD");
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(signedRegister.signature))
    throw Error("External register signature encoding invalid: HOLD");
  const signature=Buffer.from(signedRegister.signature,"base64");
  if(signature.length!==64||!verify(null,canonicalBytes(record),key,signature))
    throw Error("External register signature mismatch: HOLD");
  const registerDigest=digestRegister(record);
  independentlyPinned(externalPin,registerDigest,record);
  if(previousPin===null){
    if(record.sequence!==1||record.previousRegisterDigest!==null)
      throw Error("Genesis register must start at sequence one: HOLD");
  }else{
    if(!SHA.test(previousPin.registerDigest||"")||
       !SHA.test(previousPin.headDigest||"")||
       !Number.isSafeInteger(previousPin.sequence)||previousPin.sequence<1||
       record.sequence!==previousPin.sequence+1||
       record.previousRegisterDigest!==previousPin.registerDigest)
      throw Error("External register chain/rollback detected: HOLD");
  }
  return {status:"PINNED_REGISTER_SIGNATURE_VERIFIED",registerDigest,
    headDigest:record.headDigest,sequence:record.sequence,receiptCount:record.receiptCount,
    registerRef:record.registerRef,externalReference:externalPin.externalReference};
}
export function reconcileExternalRotationRegister({
  comments,signedRegister,publicKeyPem,trustedFingerprint,externalPin,previousPin=null,
  evidenceByReceiptDigest,trustedFingerprintsByReceiptDigest,now=new Date()
}){
  const proof=verifyExternalRotationRegister({
    signedRegister,publicKeyPem,trustedFingerprint,externalPin,previousPin,now});
  const r=signedRegister.register;
  const github=crossAnchorHistory({comments,expectedIssueNumber:r.issueNumber,
    independentHeadDigest:r.headDigest});
  if(github.entries.length!==r.receiptCount)
    throw Error("External rotation register count differs from GitHub handoffs: HOLD");
  for(let i=0;i<github.entries.length;i++){
    const expected=r.entries[i],actual=github.entries[i];
    if(columns.some(k=>actual[k]!==expected[k]))
      throw Error("External register receipt history differs from current GitHub records: HOLD");
  }
  if(github.unauthorized.length)
    throw Error("Unauthorized handoff-like GitHub comments require owner review: HOLD");
  const signedProofs=reconcileCrossAnchorProofHistory({comments,
    independentHeadDigest:r.headDigest,evidenceByReceiptDigest,
    trustedFingerprintsByReceiptDigest});
  if(signedProofs.verifiedReceipts!==r.receiptCount)
    throw Error("Signed source package reconciliation incomplete: HOLD");
  return {status:"VERIFIED_EXTERNAL_REGISTER_AND_SIGNED_HANDOFFS",
    registerDigest:proof.registerDigest,headDigest:proof.headDigest,
    sequence:proof.sequence,verifiedReceipts:signedProofs.verifiedReceipts,
    externalReference:proof.externalReference,storageMutation:false};
}
/** Independent service READ ONLY. Caller retains and pins public key/digest
 * separately: downloading a public key/pin from the same endpoint is unsafe.
 */
export async function fetchExternalRotationRegister({url,request=fetch}){
  const target=new URL(url);
  if(target.protocol!=="https:"||target.username||target.password||
     target.port||target.hostname==="github.com"||target.hostname==="api.github.com"||
     target.hostname.endsWith(".github.com")||target.hostname==="localhost")
    throw Error("HTTPS independent external rotation register URL required: HOLD");
  const response=await request(target.href,{method:"GET",headers:{Accept:"application/json"},
    redirect:"error",signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error("Independent register retrieval failed: HTTP "+response.status);
  const declared=Number(response.headers?.get?.("content-length")||"0");
  if(declared>262144)throw Error("External register exceeds size cap: HOLD");
  const body=await response.text();
  if(body.length>262144)throw Error("External register too large: HOLD");
  let result;
  try{result=JSON.parse(body)}catch{throw Error("External register JSON invalid: HOLD")}
  if(!result||typeof result!=="object"||!result.register)
    throw Error("External register document missing: HOLD");
  return result;
}
