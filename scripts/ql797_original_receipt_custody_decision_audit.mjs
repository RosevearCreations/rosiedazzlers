/** Build 797: protected ORIGINAL-only QL-363 custody and owner-decision audit.
 * No transport, database writer, authority signer, source grant or retry exists
 * in this module. External original/private adapters must prove every read. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createQl796OriginalDeviceReceiptCandidate} from
  './ql796_original_ql363_signature_receipt_candidate.mjs';

const ID='rosiedazzlers',HOLD='DISCONNECTED / HOLD';
const SCHEMA='rosie.comms.ql797.original-receipt-custody-decision-audit.v1';
const HEX=/^[0-9a-f]{64}$/,SIG=/^[A-Za-z0-9_-]{86}$/;
const roles=['source_owner','master_owner'];
const peers={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const peerKeys=['peer_id','peer_kind','source_repo','connection_state',
  'source_test_authorized','customer_data_allowed'];
const importKeys=['schema','sourceId','operationId','requestSha256',
  'receiptSha256','signedRetentionSha256','sourceCommitSha','originalComputer',
  'ownerOnlyAcl','immutableObjectId','uniqueImportCount','importedAt',
  'retainUntil','customerBytes','deviceActions','sourceRepositoryWrites',
  'connectedCount','connectionState'];
const witnessKeys=['schema','role','sourceId','operationId',
  'requestSha256','receiptSha256','importSha256','originalComputer',
  'scope','issuedAt','expiresAt','connected'];
const archiveKeys=['schema','state','sourceId','operationId',
  'importSha256','witnessSha256','sequence','previousSha256','headSha256',
  'independentStoreId','immutableReadback','ownerOnlyAcl','connectedCount',
  'observedAt'];
const decisionKeys=['schema','role','sourceId','operationId',
  'requestSha256','receiptSha256','importSha256','archiveHeadSha256',
  'decision','environment','audience','scope','issuedAt','expiresAt',
  'sourceTestAuthorized','customerDataAllowed','deviceActions'];
const auditKeys=['schema','state','sourceId','operationId','importSha256',
  'archiveHeadSha256','witnessSha256','ownerDecisionsSha256','decision',
  'sequence','previousSha256','rowSha256','ownerOnlyAcl','immutable',
  'connectedCount','connectionState','sourceTestAuthorized',
  'customerDataAllowed','customerCommunications','deviceActions',
  'sourceRepositoryWrites','createdAt'];
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>obj(v)&&Object.keys(v).length===keys.length&&
  Object.keys(v).every(k=>keys.includes(k));
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  obj(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canon(v)).digest('hex');
const held=(state,more={})=>({schema:SCHEMA,state,accepted:false,
  baselineOriginalQl796ReceiptVerified:false,importedReceiptCustodyVerified:false,
  independentCustodyWitnessVerified:false,independentArchiveHeadVerified:false,
  independentOwnerDecisionVerified:false,ownerDecisionAuditWitnessVerified:false,
  postDecisionSixAppIsolationVerified:false,
  candidateReviewOnly:true,connected:false,connectedCount:0,
  connectionState:HOLD,sourceTestAuthorized:false,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  automaticRetries:false,...more});
const utc=x=>{
  const n=Date.parse(x);
  return Number.isFinite(n)&&x===new Date(n).toISOString()?n:NaN;
};
const fresh=(p,t,limit)=>{
  const a=utc(p?.issuedAt),b=utc(p?.expiresAt);
  return Number.isFinite(a)&&Number.isFinite(b)&&a<=t+5_000&&
    a>=t-90_000&&b>t&&b>a&&b-a<=limit;
};
const current=(n,t)=>Number.isFinite(n)&&Math.abs(n-t)<=30_000;
function verifyImport(p,baseline,record,t){
  if(!exact(p,importKeys)||
    p.schema!=='rosie.comms.ql797.original-ql363-custody-import.v1'||
    p.sourceId!==ID||p.operationId!==baseline.operationId||
    p.requestSha256!==baseline.requestSha256||
    p.receiptSha256!==baseline.receiptSha256||
    p.signedRetentionSha256!==baseline.signedRetentionSha256||
    p.sourceCommitSha!==record.commitSha||
    p.originalComputer!=='DESKTOP-AE894KC'||p.ownerOnlyAcl!==true||
    p.immutableObjectId!=='rosie-ql363-'+baseline.receiptSha256||
    p.uniqueImportCount!==1||p.customerBytes!==0||p.deviceActions!==0||
    p.sourceRepositoryWrites!==0||p.connectedCount!==0||
    p.connectionState!==HOLD)return false;
  const a=utc(p.importedAt),b=utc(p.retainUntil);
  return current(a,t)&&b>t+86_400_000;
}
async function verifySigner(op,role,att,forbidden,t){
  if(!exact(att,['payload','signature','keyId'])||!SIG.test(att.signature??''))
    return null;
  const pin=await op.resolveOriginalQl797AuthorityPin({role,sourceId:ID});
  if(pin?.role!==role||pin.sourceId!==ID||pin.keyId!==att.keyId||
    pin.revoked!==false||!HEX.test(pin.spkiSha256??'')||
    forbidden.includes(pin.spkiSha256)||
    typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)
    return null;
  const key=createPublicKey(pin.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==pin.spkiSha256||
    !verify(null,Buffer.from(canon(att.payload)),key,
      Buffer.from(att.signature,'base64url')))
    return null;
  const digest=sha(att.payload);
  const custody=await op.readIndependentQl797AuthorityCustody({role,sourceId:ID,
    keyId:pin.keyId,spkiSha256:pin.spkiSha256,payloadSha256:digest});
  if(custody?.state!=='INDEPENDENT_ORIGINAL_QL797_SIGNER_AUTHENTICATED'||
    custody.role!==role||custody.sourceId!==ID||
    custody.keyId!==pin.keyId||custody.spkiSha256!==pin.spkiSha256||
    custody.payloadSha256!==digest||custody.revoked!==false||
    !current(custody.observedAt,t))return null;
  return pin.spkiSha256;
}
function verifyArchive(a,baseline,imp,witness,t){
  if(!exact(a,archiveKeys)||
    a.schema!=='rosie.comms.ql797.independent-import-archive-head.v1'||
    a.state!=='ORIGINAL_IMMUTABLE_CUSTODY_HEAD_INDEPENDENTLY_RECORDED'||
    a.sourceId!==ID||a.operationId!==baseline.operationId||
    a.importSha256!==imp||a.witnessSha256!==witness||
    !Number.isSafeInteger(a.sequence)||a.sequence<1||
    !HEX.test(a.previousSha256??'')||!HEX.test(a.headSha256??'')||
    !/^rosie-custody-[a-z0-9-]{3,45}$/.test(a.independentStoreId??'')||
    a.immutableReadback!==true||a.ownerOnlyAcl!==true||a.connectedCount!==0||
    !current(a.observedAt,t))return false;
  return a.headSha256===sha({sourceId:ID,operationId:a.operationId,
    importSha256:imp,witnessSha256:witness,sequence:a.sequence,
    previousSha256:a.previousSha256})&&a.headSha256!==a.previousSha256;
}
function verifySix(snapshot){
  if(snapshot?.state!=='QL797_AFTER_OWNER_DECISION_SIX_PEERS_HELD'||
    snapshot.databaseRole!=='ql340c_private_receiver'||
    snapshot.connectedCount!==0||!Array.isArray(snapshot.rows)||
    snapshot.rows.length!==6)return false;
  const seen=new Set();
  for(const row of snapshot.rows){
    if(!exact(row,peerKeys)||!Object.hasOwn(peers,row.peer_id)||
      seen.has(row.peer_id))return false;
    const [kind,repo]=peers[row.peer_id];
    if(row.peer_kind!==kind||row.source_repo!==repo||
      row.connection_state!=='HOLD'||row.source_test_authorized!==false||
      row.customer_data_allowed!==false)return false;
    seen.add(row.peer_id);
  }
  return seen.size===6;
}
const decisionIsValid=(p,role,baseline,imp,archive,t)=>
  exact(p,decisionKeys)&&
  p.schema==='rosie.comms.ql797.original-owner-reviewed-hold-decision.v1'&&
  p.role===role&&p.sourceId===ID&&p.operationId===baseline.operationId&&
  p.requestSha256===baseline.requestSha256&&
  p.receiptSha256===baseline.receiptSha256&&p.importSha256===imp&&
  p.archiveHeadSha256===archive&&
  ['ACKNOWLEDGE_HOLD','REQUEST_MORE_EVIDENCE','REJECT_CONNECTION'].includes(p.decision)&&
  p.environment==='TEST'&&
  p.audience==='rosiedazzlers:ql797:original-offline-owner-review'&&
  p.scope==='AUDIT_ONLY_NO_CONNECTION_OR_SOURCE_GRANT'&&
  p.sourceTestAuthorized===false&&p.customerDataAllowed===false&&
  p.deviceActions===false&&fresh(p,t,90_000);
function verifyAudit(a,baseline,imp,archive,witness,decisionsSha,choice,t){
  if(!exact(a,auditKeys)||
    a.schema!=='rosie.comms.ql797.original-owner-hold-audit-row.v1'||
    a.state!=='ORIGINAL_OWNER_GOVERNED_HELD_DECISION_AUDITED'||
    a.sourceId!==ID||a.operationId!==baseline.operationId||
    a.importSha256!==imp||a.archiveHeadSha256!==archive||
    a.witnessSha256!==witness||a.ownerDecisionsSha256!==decisionsSha||
    a.decision!==choice||!Number.isSafeInteger(a.sequence)||a.sequence<1||
    !HEX.test(a.previousSha256??'')||!HEX.test(a.rowSha256??'')||
    a.ownerOnlyAcl!==true||a.immutable!==true||a.connectedCount!==0||
    a.connectionState!==HOLD||a.sourceTestAuthorized!==false||
    a.customerDataAllowed!==false||a.customerCommunications!==false||
    a.deviceActions!==false||a.sourceRepositoryWrites!==0||
    !current(utc(a.createdAt),t))return false;
  const {rowSha256,...head}=a;
  return a.rowSha256===sha(head)&&a.rowSha256!==a.previousSha256;
}
export function createQl797OriginalReceiptCustodyAudit({originalOperator,now=()=>Date.now()}={}){
  const callbacks=['readOriginalQl797ImportedReceipt','readOriginalQl797CustodyWitness',
    'resolveOriginalQl797AuthorityPin','readIndependentQl797AuthorityCustody',
    'readOriginalQl797ArchiveRecord','readIndependentQl797ArchiveAnchor',
    'readOriginalQl797OwnerDecisions','readOriginalQl797AuditedDecision',
    'readIndependentQl797DecisionAnchor',
    'readIndependentSixPeerSnapshotAfterDecision'];
  if(typeof now!=='function'||callbacks.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL797_PRIVATE_ADAPTER_AND_SIGNERS_REQUIRED');
  const baselineVerifier=createQl796OriginalDeviceReceiptCandidate({originalOperator,now});
  let attempted=false;
  return Object.freeze({
    inspect(){return held('HOLD_ORIGINAL_QL363_CUSTODY_AND_OWNER_AUDIT_REQUIRED',{attempted});},
    async reviewOne(input){
      if(attempted)return held('DENY_DUPLICATE_OR_REPLAYED_QL797_AUDIT_ATTEMPT');
      attempted=true;
      const t=now();
      if(!Number.isSafeInteger(t))return held('HOLD_TRUSTED_ORIGINAL_CLOCK_REQUIRED');
      try{
        const b=await baselineVerifier.reviewOne(input);
        if(!b.accepted||b.connected!==false||b.sourceTestAuthorized!==false||
          b.connectionState!==HOLD||b.sixPeersHeld!==true)
          return held('HOLD_ORIGINAL_QL796_SOURCE_GET_EVIDENCE_NOT_VERIFIED',
            {baselineHoldState:b.state});
        const p=await originalOperator.readOriginalQl797ImportedReceipt({
          sourceId:ID,operationId:b.operationId,requestSha256:b.requestSha256,
          receiptSha256:b.receiptSha256});
        if(!verifyImport(p,b,input.record,t))
          return held('HOLD_GENUINE_IMMUTABLE_ORIGINAL_RECEIPT_CUSTODY_IMPORT');
        const imp=sha(p);
        const preflight=await originalOperator.readOriginalQl362DevicePreflight({sourceId:ID});
        const reserved=[preflight.issuerSpkiSha256,preflight.witnessSpkiSha256,
          preflight.sourceOwnerSpkiSha256,preflight.masterOwnerSpkiSha256,
          preflight.redactionAuditorSpkiSha256];
        const sourceSigner=await originalOperator.resolveOriginalSourceSignerPin({sourceId:ID});
        const retention=await originalOperator.resolveOriginalRetentionWitnessPin({sourceId:ID});
        reserved.push(sourceSigner?.spkiSha256,retention?.spkiSha256);
        if(reserved.some(x=>!HEX.test(x??''))||new Set(reserved).size!==reserved.length)
          return held('HOLD_ORIGINAL_SIGNER_ROLE_ISOLATION');
        const att=await originalOperator.readOriginalQl797CustodyWitness({
          sourceId:ID,operationId:b.operationId,importSha256:imp});
        const w=att?.payload;
        if(!exact(w,witnessKeys)||w.schema!=='rosie.comms.ql797.original-custody-witness.v1'||
          w.role!=='custody_witness'||w.sourceId!==ID||
          w.operationId!==b.operationId||w.requestSha256!==b.requestSha256||
          w.receiptSha256!==b.receiptSha256||w.importSha256!==imp||
          w.originalComputer!=='DESKTOP-AE894KC'||
          w.scope!=='ORIGINAL_OWNER_ONLY_IMMUTABLE_RECEIPT_RETENTION'||
          w.connected!==false||!fresh(w,t,90_000))
          return held('HOLD_EXACT_INDEPENDENT_ORIGINAL_CUSTODY_WITNESS');
        const wpin=await verifySigner(originalOperator,'custody_witness',att,reserved,t);
        if(!wpin)return held('HOLD_INDEPENDENT_ED25519_CUSTODY_WITNESS');
        const witnessSha256=sha(w);
        const archive=await originalOperator.readOriginalQl797ArchiveRecord({
          sourceId:ID,operationId:b.operationId,importSha256:imp,witnessSha256});
        if(!verifyArchive(archive,b,imp,witnessSha256,t))
          return held('HOLD_ORIGINAL_IMMUTABLE_ARCHIVE_CHAIN');
        const anchor=await originalOperator.readIndependentQl797ArchiveAnchor({
          sourceId:ID,headSha256:archive.headSha256,
          sequence:archive.sequence,storeId:archive.independentStoreId});
        if(anchor?.state!=='INDEPENDENT_ORIGINAL_ARCHIVE_HEAD_READBACK'||
          anchor.headSha256!==archive.headSha256||
          anchor.previousSha256!==archive.previousSha256||
          anchor.sequence!==archive.sequence||
          anchor.independentStoreId!==archive.independentStoreId||
          anchor.immutable!==true||anchor.connectedCount!==0)
          return held('HOLD_INDEPENDENT_ORIGINAL_ARCHIVE_ANCHOR');
        const signed=await originalOperator.readOriginalQl797OwnerDecisions({
          sourceId:ID,operationId:b.operationId,archiveHeadSha256:archive.headSha256});
        if(!exact(signed,['sourceOwner','masterOwner']))
          return held('HOLD_ORIGINAL_DUAL_OWNER_AUDIT_DECISIONS');
        const ownerKeys=[];
        const chosen=[];
        for(const [role,key] of [['source_owner','sourceOwner'],['master_owner','masterOwner']]){
          const s=signed[key];
          if(!decisionIsValid(s?.payload,role,b,imp,archive.headSha256,t))
            return held('HOLD_EXACT_ORIGINAL_OWNER_DECISION_SCOPE');
          const fingerprint=await verifySigner(originalOperator,role,s,
            [wpin,...ownerKeys,...reserved.filter(x=>x!==preflight[
              role==='source_owner'?'sourceOwnerSpkiSha256':'masterOwnerSpkiSha256'])],t);
          if(!fingerprint||fingerprint!==preflight[
            role==='source_owner'?'sourceOwnerSpkiSha256':'masterOwnerSpkiSha256'])
            return held('HOLD_INDEPENDENT_ORIGINAL_OWNER_DECISION_SIGNATURE');
          ownerKeys.push(fingerprint);chosen.push(s.payload.decision);
        }
        if(chosen[0]!==chosen[1])
          return held('HOLD_DIVERGENT_ORIGINAL_OWNER_DECISIONS');
        const decisionsSha256=sha(signed);
        const audit=await originalOperator.readOriginalQl797AuditedDecision({
          sourceId:ID,operationId:b.operationId,ownerDecisionsSha256:decisionsSha256});
        const ap=audit?.payload;
        if(!verifyAudit(ap,b,imp,archive.headSha256,witnessSha256,
          decisionsSha256,chosen[0],t))
          return held('HOLD_APPEND_ONLY_OWNER_DECISION_AUDIT');
        const apin=await verifySigner(originalOperator,'audit_witness',audit,
          [...reserved,wpin],t);
        if(!apin)return held('HOLD_INDEPENDENT_APPEND_ONLY_AUDIT_SIGNER');
        const final=await originalOperator.readIndependentQl797DecisionAnchor({
          sourceId:ID,operationId:b.operationId,rowSha256:ap.rowSha256});
        if(final?.state!=='INDEPENDENT_OWNER_DECISION_APPEND_ONLY_ANCHOR'||
          final.rowSha256!==ap.rowSha256||
          final.previousSha256!==ap.previousSha256||
          final.sequence!==ap.sequence||final.immutable!==true||
          final.connectedCount!==0)
          return held('HOLD_INDEPENDENT_FINAL_OWNER_DECISION_ANCHOR');
        const six=await originalOperator.readIndependentSixPeerSnapshotAfterDecision({
          sourceId:ID,operationId:b.operationId,rowSha256:ap.rowSha256});
        if(!verifySix(six))return held('DENY_ANY_SIX_APP_CONNECTION_OR_TENANT_GRANT');
        return {...held('ORIGINAL_QL363_CUSTODY_OWNER_HOLD_DECISION_INDEPENDENTLY_AUDITED'),
          accepted:true,baselineOriginalQl796ReceiptVerified:true,
          importedReceiptCustodyVerified:true,independentCustodyWitnessVerified:true,
          independentArchiveHeadVerified:true,independentOwnerDecisionVerified:true,
          ownerDecisionAuditWitnessVerified:true,
          postDecisionSixAppIsolationVerified:true,
          sourceId:ID,operationId:b.operationId,receiptSha256:b.receiptSha256,
          importSha256:imp,archiveHeadSha256:archive.headSha256,
          ownerDecisionsSha256:decisionsSha256,decisionAuditSha256:ap.rowSha256,
          ownerDecision:chosen[0],nextAction:'Continue DISCONNECTED/HOLD; original owner decision is audit-only.'};
      }catch{return held('HOLD_ORIGINAL_INDEPENDENT_QL363_CUSTODY_OR_OWNER_READBACK_UNAVAILABLE');}
    }
  });
}
export function ql797Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_REAL_ORIGINAL_CUSTODY_WITNESS_AND_OWNER_AUDIT_UNAVAILABLE');
  throw Error('DENY_PUBLIC_RECEIPT_IMPORT_CONNECTION_OR_OWNER_SIGNATURE');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql797Cli())+'\n');}
  catch{process.stderr.write('DENY_ROSIE_QL797_UNSUPERVISED_CONNECTION_OR_IMPORT\n');process.exitCode=1;}
}
