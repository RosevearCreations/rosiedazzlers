/** Rosie Dazzlers Build 793 — private QL-360 archive import, first Rosie
 * source receipt custody, and authoritative connection-state reconciliation.
 * This server-only adapter never reads arbitrary uploaded JSON as trust,
 * signs, grants a source, contacts the broker, or changes peer state.
 */
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HEALTH='/api/integration/v1/shell/health';
const HELD='DISCONNECTED / HOLD';
const SOURCE='rosiedazzlers';
const expectedPeers=Object.freeze({
  rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],
  icamp:['business','iCamp'],
  yw:['business','yw'],
  'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']
});
const isRecord=v=>v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,k)=>isRecord(v)&&Object.keys(v).length===k.length&&
  Object.keys(v).every(x=>k.includes(x));
const sha=v=>createHash('sha256').update(canonical(v)).digest('hex');
function canonical(v){
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(isRecord(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
const hold=(state,extra={})=>({
  schema:'rosie.comms.ql793.original-archive-source-connection-reconciliation.v1',
  state,accepted:false,originalArchiveVerified:false,
  independentSourceReceiptVerified:false,testEvidenceTransitionVerified:false,
  connectionTransitionVerified:false,
  testEvidenceState:'UNVERIFIED / HOLD',connected:false,
  connectionState:HELD,connectedSourceCount:0,sourceGrants:0,
  customerCommunications:0,deviceActions:0,receiverActivated:false,
  retryAutomatically:false,...extra
});
const sourceArchiveFields=['schema','kind','sessionId','deviceId',
  'signedTranscriptSha256','externallyPinnedWitnessSpkiSha256',
  'closeoutAt','shutdownObservedAt','receiptCount','revocationCount',
  'receiverListenerCount','tailnetGatewayListenerCount','authenticatedDatabaseRole',
  'peerCount','connectedCount','sources','customerCommunications','deviceActions'];
const sourceRowFields=['id','kind','sourceRepository','state'];
const peerRowFields=['peerId','kind','repository','connection',
  'sourceTestAuthorized','customerDataAllowed'];
const snapshotFields=['schema','exportedAt','source','peerCount',
  'connectedCount','customerCommunications','deviceActions','authorizedExternalGets',
  'heldDeviceReceiptCount','peers','witness'];
const receiptFields=['schema','state','sourceId','tenantId','environment',
  'method','path','deviceId','ql360ArchiveSha256','ql359SessionId',
  'ql359TranscriptSha256','sourceEnrollmentSha256','sourceSignerSpkiSha256',
  'sourceOwnerDecisionSha256','masterOwnerDecisionSha256',
  'originalIssuerSpkiSha256','independentWitnessSpkiSha256',
  'originalOperationId','requestSha256','brokerReceiptSha256',
  'signedFieldWitnessSha256','firstSourceReceiptCount','authorizedSourceGrants',
  'sourceTestAuthorized','customerBytes','connected','connectionState'];
const samePeers=(rows,fromArchive=false)=>{
  if(!Array.isArray(rows)||rows.length!==6)return false;
  const set=new Set();
  for(const p of rows){
    const id=fromArchive?p?.id:p?.peerId;
    if(!keys(p,fromArchive?sourceRowFields:peerRowFields)||
      !Object.hasOwn(expectedPeers,id)||set.has(id))return false;
    const [kind,repo]=expectedPeers[id];
    if(p.kind!==kind||(fromArchive?p.sourceRepository:p.repository)!==repo||
      (fromArchive?p.state:p.connection)!==(fromArchive?'HOLD':HELD))return false;
    if(!fromArchive&&(p.sourceTestAuthorized!==false||p.customerDataAllowed!==false))return false;
    set.add(id);
  }
  return set.size===6;
};
function validArchive(ticket,readback,at){
  if(ticket?.schema!=='rosevear.hub.ql360.original-private-evidence-archive.v1'||
    ticket.state!=='ORIGINAL_PRIVATE_TEST_ARCHIVE_VERIFIED_ALL_SIX_PEERS_STILL_HELD'||
    ticket.authenticatedOriginalArchive!==true||
    ticket.timeBoundShutdownWitnessVerified!==true||
    ticket.exactOneImmutableReceiptVerified!==true||
    ticket.sixPeersHeldVerified!==true||ticket.exportedEvidenceCount!==6||
    ticket.archiveAccepted!==true||ticket.receiverActivated!==false||
    ticket.connected!==false||ticket.connectedCount!==0||
    ticket.connectionState!==HELD||
    !/^ql360-[0-9a-f-]{36}\.json$/.test(ticket.archiveId??'')||
    !SHA.test(ticket.evidenceSha256??''))return false;
  const e=readback?.evidence;
  if(readback?.state!=='ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED'||
    readback.originalComputer!=='DESKTOP-AE894KC'||
    readback.originalUser!=='Ree'||readback.ownerOnlyAcl!==true||
    readback.archiveId!==ticket.archiveId||
    readback.sha256!==ticket.evidenceSha256||
    !keys(e,sourceArchiveFields)||sha(e)!==ticket.evidenceSha256||
    e.schema!==ticket.schema||e.kind!=='ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY'||
    e.deviceId!=='rosevear-windows-hub'||
    !SHA.test(e.signedTranscriptSha256??'')||
    !SHA.test(e.externallyPinnedWitnessSpkiSha256??'')||
    typeof e.sessionId!=='string'||e.sessionId.length<1||e.sessionId.length>128||
    e.receiptCount!==1||e.revocationCount!==0||e.receiverListenerCount!==0||
    e.tailnetGatewayListenerCount!==0||
    e.authenticatedDatabaseRole!=='ql340c_private_receiver'||
    e.peerCount!==6||e.connectedCount!==0||
    e.customerCommunications!==false||e.deviceActions!==false||
    !samePeers(e.sources,true))return false;
  const closed=Date.parse(e.closeoutAt),stopped=Date.parse(e.shutdownObservedAt);
  return Number.isFinite(closed)&&Number.isFinite(stopped)&&
    closed<=stopped&&stopped<=at;
}
function validSourceReceipt(r,e,archiveSha){
  if(!keys(r,receiptFields)||
    r.schema!=='rosie.comms.ql793.protected-first-source-receipt.v1'||
    r.state!=='ORIGINAL_ROSIE_FIRST_TEST_SIGNED_RECEIPT_RECONCILED'||
    r.sourceId!==SOURCE||r.tenantId!=='rosie-dazzlers'||
    r.environment!=='TEST'||r.method!=='GET'||r.path!==HEALTH||
    r.deviceId!==e.deviceId||r.ql360ArchiveSha256!==archiveSha||
    r.ql359SessionId!==e.sessionId||
    r.ql359TranscriptSha256!==e.signedTranscriptSha256||
    r.independentWitnessSpkiSha256!==e.externallyPinnedWitnessSpkiSha256||
    r.firstSourceReceiptCount!==1||r.authorizedSourceGrants!==0||
    r.sourceTestAuthorized!==false||r.customerBytes!==0||
    r.connected!==false||r.connectionState!==HELD||
    !UUID.test(r.originalOperationId??''))return false;
  const signed=['sourceEnrollmentSha256','sourceSignerSpkiSha256',
    'sourceOwnerDecisionSha256','masterOwnerDecisionSha256',
    'originalIssuerSpkiSha256','independentWitnessSpkiSha256',
    'requestSha256','brokerReceiptSha256','signedFieldWitnessSha256'];
  return signed.every(k=>SHA.test(r[k]??''))&&
    new Set(signed.map(k=>r[k])).size===signed.length;
}
function validSnapshot(s,e,at){
  if(!keys(s,snapshotFields)||s.schema!=='rosevear.hub.ql341.private-peer-readback.v1'||
    s.source!=='PRIVATE_POSTGRES_OWNER_READBACK'||
    s.peerCount!==6||s.connectedCount!==0||
    s.customerCommunications!==0||s.deviceActions!==0||
    s.authorizedExternalGets!==0||s.heldDeviceReceiptCount!==1||
    !samePeers(s.peers)||!isRecord(s.witness)||
    s.witness.verified!==true||s.witness.connected!==false||
    s.witness.state!=='ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED')
    return false;
  const observed=Date.parse(s.exportedAt);
  return Number.isFinite(observed)&&observed>=Date.parse(e.shutdownObservedAt)&&
    observed<=at&&at-observed<=120_000;
}

/** Four trusted, independently authenticated ORIGINAL private operators.
 * The QL-360 archive may be imported only by genuine owner-ACL readback.
 * JSON passed from a browser, a file upload or a CI fixture is never a role.
 */
export function createQl793OriginalTrustReconciliation({originalOperator,now=()=>Date.now()}={}){
  const required=['verifyOriginalQl360Archive','readOriginalQl360Archive',
    'verifyOriginalRosieFirstSourceReceipt','readOriginalSixAppPeerSnapshot'];
  if(typeof now!=='function'||required.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL360_ARCHIVE_ROSIE_SIGNER_AND_PRIVATE_DB_REQUIRED');
  let attempted=false;
  return Object.freeze({
    inspect(){return hold('HOLD_ORIGINAL_QL360_FIELD_ARCHIVE_AND_SOURCE_CONNECTION_GRANT',
      {attempted});},
    async importAndReconcile(){
      if(attempted)return hold('DENY_DUPLICATE_OR_REPLAYED_ORIGINAL_RECEIPT_IMPORT');
      attempted=true;
      try{
        const time=now();
        if(!Number.isFinite(time))return hold('HOLD_TRUSTED_TIME_SOURCE_UNAVAILABLE');
        const archive=await originalOperator.verifyOriginalQl360Archive();
        if(!archive?.archiveAccepted||!SHA.test(archive.evidenceSha256??''))
          return hold('HOLD_ORIGINAL_PRIVATE_ARCHIVE_NOT_AUTHENTICATED');
        const readback=await originalOperator.readOriginalQl360Archive({
          archiveId:archive.archiveId,expectedSha256:archive.evidenceSha256});
        if(!validArchive(archive,readback,time))
          return hold('HOLD_ORIGINAL_ACL_ARCHIVE_DIGEST_SHUTDOWN_OR_SIX_PEERS_MISMATCH');
        const e=readback.evidence;
        const source=await originalOperator.verifyOriginalRosieFirstSourceReceipt({
          sourceId:SOURCE,tenantId:'rosie-dazzlers',
          archiveSha256:archive.evidenceSha256,
          ql359SessionId:e.sessionId,ql359TranscriptSha256:e.signedTranscriptSha256});
        if(!validSourceReceipt(source,e,archive.evidenceSha256))
          return hold('HOLD_ROSIE_ORIGINAL_SIGNER_OWNERS_OR_FIRST_GET_RECEIPT_MISMATCH');
        const peers=await originalOperator.readOriginalSixAppPeerSnapshot({
          sourceId:SOURCE,expectedArchiveSha256:archive.evidenceSha256,
          sourceEnrollmentSha256:source.sourceEnrollmentSha256,
          sourceReceiptSha256:source.brokerReceiptSha256});
        if(!validSnapshot(peers,e,time))
          return hold('HOLD_ORIGINAL_SIX_PEER_SOURCE_GRANT_OR_FRESH_STATE_DRIFT');
        return {...hold('ORIGINAL_ROSIE_TEST_EVIDENCE_VERIFIED_CONNECTION_REMAINS_HELD'),
          accepted:true,originalArchiveVerified:true,
          independentSourceReceiptVerified:true,testEvidenceTransitionVerified:true,
          priorEvidenceState:'UNVERIFIED / HOLD',
          testEvidenceState:'VERIFIED TEST / HOLD',
          verifiedConnectionTransition:'UNVERIFIED_TEST_TO_VERIFIED_TEST_ONLY',
          originalArchiveSha256:archive.evidenceSha256,
          originalRosieSourceEnrollmentSha256:source.sourceEnrollmentSha256,
          originalOperationId:source.originalOperationId,
          firstSignedBrokerReceiptSha256:source.brokerReceiptSha256,
          nextAction:'A separate independently signed source TEST grant and current authorized DB readback are required before CONNECTED may be claimed.'};
      }catch{return hold('HOLD_ORIGINAL_FIELD_OR_PROTECTED_LEDGER_UNAVAILABLE');}
    }
  });
}

export function ql793Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return hold('HOLD_PRIVATE_QL360_ARCHIVE_AND_SOURCE_CONNECTION_NOT_IN_PUBLIC_REPO');
  throw Error('DENY_PUBLIC_OR_UNSUPERVISED_ARCHIVE_IMPORT_OR_CONNECTED_TRANSITION');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql793Cli())+'\n');}
  catch{process.stderr.write('DENY_PUBLIC_QL793_ORIGINAL_FIELD_IMPORT\n');process.exitCode=1;}
}
