// Rosie 875: pure fail-closed source-completeness and drift assessment.
// Read-only; NEVER authorizes refunds, invoices, bookings or pilot closure.
const sources=new Set(['stripe_live','paypal_live']);
const states=new Set(['net_deposit_intact','partial_refund_verified','full_refund_verified']);
const whole=x=>Number.isSafeInteger(x)&&x>=0;
function valid(p){
 return p?.net_verified===true&&sources.has(p.source)&&states.has(p.state)&&
  whole(p.gross_cents)&&p.gross_cents>0&&whole(p.refunded_cents)&&
  whole(p.net_cents)&&p.refunded_cents+p.net_cents===p.gross_cents&&
  ['stripe','paypal'].includes(p.provider)&&p.source===p.provider+'_live';
}
export function assessRoadsideRefundDrift({snapshot,live,bookingId,nowMs=Date.now()}={}){
 const base={alert:true,read_only:true,refund_or_payment_mutated:false,
  provider_checked_live:true,source_snapshot_matches_live:false,
  source_completeness_verified:false};
 if(!bookingId||!snapshot)return {...base,state:'BASELINE_MISSING',
  reason:'No original provider readback baseline exists; run the original deposit reconciliation'};
 if(snapshot.booking_id!==bookingId)return {...base,state:'BOOKING_ID_MISMATCH',
  reason:'Saved snapshot is not linked to the exact original booking'};
 if(!valid(live))return {...base,state:'PROVIDER_SOURCE_HOLD',
  reason:live?.reason||'Fresh provider refund completeness could not be independently established'};
 if(!valid(snapshot))return {...base,state:'SAVED_SOURCE_HOLD',
  reason:'Saved original deposit baseline was not complete or verified'};
 const fields=['provider','source','state','gross_cents','refunded_cents','net_cents'];
 const changed=fields.filter(k=>snapshot[k]!==live[k]);
 if(changed.length)return {...base,state:'REFUND_COMPLETENESS_DRIFT',
  changed_fields:changed,reason:'Original provider amounts or outcome changed since the last saved readback',
  live:{provider:live.provider,source:live.source,state:live.state,
   gross_cents:live.gross_cents,refunded_cents:live.refunded_cents,net_cents:live.net_cents}};
 const when=Date.parse(snapshot.checked_at);
 const age=nowMs-when;
 if(!Number.isFinite(when)||!Number.isFinite(age)||age<0||age>15*60*1000)
  return {...base,state:'STALE_SOURCE_BASELINE',
   reason:'Saved provider evidence is older than fifteen minutes; new source readback required'};
 return {...base,state:'SOURCE_STABLE',alert:false,
  source_snapshot_matches_live:true,source_completeness_verified:true,
  reason:'Original provider currently matches a recent independently verified refund snapshot',
  live:{provider:live.provider,source:live.source,state:live.state,
   gross_cents:live.gross_cents,refunded_cents:live.refunded_cents,net_cents:live.net_cents}};
}
