// Rosie Dazzlers protocol 1.1: contract negotiation only, not live connectivity.
// Never treat a compatible schema as proof of issuer, tenant, consent or signed ACK.
export const ROSIE_PROTOCOL_895=Object.freeze({major:1,minor:1,legacyMinor:0});
const LOCAL_READ_ONLY=new Set(['HEALTH_EVIDENCE','CORRELATION_EVENT']);
const hold=(reason)=>Object.freeze({contractCompatible:false,reason,
 localOperationsContinue:true,authenticatedTransportRequired:true,
 remoteExecutionAuthorized:false});
export function inspectRosiePeer895(peer,capability){
  if(typeof capability!=='string'||!LOCAL_READ_ONLY.has(capability))
    return hold('UNKNOWN_OR_NON_READ_ONLY_CAPABILITY');
  if(!peer||typeof peer!=='object')return hold('PEER_UNAVAILABLE');
  const major=peer.protocol?.major,minor=peer.protocol?.minor;
  if(!Number.isSafeInteger(major)||major!==ROSIE_PROTOCOL_895.major||
     !Number.isSafeInteger(minor)||minor<ROSIE_PROTOCOL_895.legacyMinor)
    return hold('INCOMPATIBLE_PROTOCOL_MAJOR');
  if(!Array.isArray(peer.capabilities)||!peer.capabilities.includes(capability))
    return hold('PEER_CAPABILITY_UNAVAILABLE');
  // Even a compatible 1.0/1.1 contract still needs independently
  // authenticated issuer, tenant, scope, consent, replay and transport checks.
  return Object.freeze({contractCompatible:true,reason:'CONTRACT_COMPATIBLE_ONLY',
   negotiatedVersion:minor>=1?'1.1':'1.0',
   localOperationsContinue:true,authenticatedTransportRequired:true,
   remoteExecutionAuthorized:false});
}
