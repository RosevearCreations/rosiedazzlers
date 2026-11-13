// Build 874: pure native-adapter event normalization for a signed relay.
// This function does NOT authenticate a provider or submit a receipt.
const validRef=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{8,160}$/.test(x);
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
export function mapNativeRoadsideProviderEvent(event){
 if(!event||typeof event!=='object'||Array.isArray(event))
  return {ok:false,reason:'Provider event object required'};
 const eventType=({
  'email.delivered':'delivered','email.failed':'failed','email.bounced':'bounced',
  'delivered':'delivered','failed':'failed','bounced':'bounced'
 })[event.type];
 const data=event.data,meta=data?.metadata;
 const dispatchId=meta?.quote_dispatch_id;
 const eventId=event.id;
 const messageId=data?.message_id;
 if(!eventType||!validRef(eventId)||!validRef(messageId)||!uuid(dispatchId))
  return {ok:false,reason:'Native event type, event ID, message ID or original dispatch correlation missing'};
 return {ok:true,canonical:{
  dispatch_id:dispatchId,provider_event_id:eventId,
  provider_message_id:messageId,event_type:eventType
 }};
}
export function checkNativeMappingAgainstDispatch(event,dispatch){
 const mapped=mapNativeRoadsideProviderEvent(event);
 if(!mapped.ok)return {ok:false,reason:mapped.reason};
 const c=mapped.canonical;
 if(!dispatch||dispatch.id!==c.dispatch_id||
  dispatch.provider_message_id!==c.provider_message_id||
  !['provider_accepted','delivery_confirmed','delivery_failed','receipt_after_withdrawal'].includes(dispatch.state))
  return {ok:false,reason:'Original accepted provider dispatch identity mismatch'};
 return {ok:true,normalized_event_type:c.event_type,dry_run_only:true,
  native_provider_signature_validated:false,provider_delivery_confirmed:false,
  customer_read_confirmed:false,no_receipt_written:true};
}
