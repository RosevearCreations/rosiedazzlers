// Rosie 878 — source-bound owner SLA acknowledgement evidence.
// Acknowledgement is NOT case resolution, a deadline reset, or payment clearance.
export function assessOwnerSlaAcknowledgement878({originalCase,acks=[],sourceCheckId,severity}={}){
 const hold=reason=>({state:'ACK_SOURCE_HOLD',acknowledged:false,reason,
  financial_case_closed:false,sla_clock_reset:false});
 if(!originalCase||!['open','reviewed_hold'].includes(originalCase.state)||
  !originalCase.id||!originalCase.draft_id||!originalCase.booking_id||
  !Number.isFinite(Date.parse(originalCase.opened_at)))
  return hold('No exact unresolved original refund case with immutable opening date');
 if(!sourceCheckId||!['CRITICAL','HIGH','REVIEW'].includes(severity))
  return hold('No exact current provider check and escalation severity');
 if(!Array.isArray(acks)||acks.length>=100)return hold('Owner acknowledgement history missing or truncated');
 const matched=acks.filter(a=>a.case_id===originalCase.id&&
  a.source_check_id===sourceCheckId&&a.severity===severity);
 if(matched.length>1)return hold('Conflicting original acknowledgement evidence');
 if(!matched.length)return {state:'OWNER_ACK_REQUIRED',acknowledged:false,
  reason:'Original owner must acknowledge current source/severity without closing case',
  original_case_opened_at:originalCase.opened_at,
  financial_case_closed:false,sla_clock_reset:false};
 const ack=matched[0];
 if(ack.original_case_opened_at!==originalCase.opened_at||
  !Number.isFinite(Date.parse(ack.acknowledged_at))||
  Date.parse(ack.acknowledged_at)<Date.parse(originalCase.opened_at))
  return hold('Persisted acknowledgement time disagrees with original immutable case');
 return {state:'OWNER_ACKNOWLEDGED',acknowledged:true,ack_id:ack.id,
  acknowledged_at:ack.acknowledged_at,owner_actor:ack.owner_actor,
  original_case_opened_at:originalCase.opened_at,
  financial_case_closed:false,sla_clock_reset:false};
}
