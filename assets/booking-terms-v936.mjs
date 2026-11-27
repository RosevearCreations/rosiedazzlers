// Build 936: shared advisory terms and request matching. No reservation or payment authority.
export const exactPositiveCad936=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&/^\d+(?:\.\d{1,2})?$/.test(String(value))&&Number.isSafeInteger(Math.round(value*100));
export function guidedDepositCents936(pkg){
 if(!pkg)return 0;
 const configured=Math.round((Number(pkg.deposit_cad||0)||0)*100);
 return configured>0?configured:['premium_wash','basic_detail'].includes(pkg.code)?5000:10000;
}
export function guidedEstimate936(pkg,size,addons=[]){
 const base=pkg?.prices_cad?.[size];let subtotal=Number.isFinite(base)?Math.round(base*100):0,quoteOnly=false;
 const seen=new Set();
 for(const a of addons){if(!a||seen.has(a.code))continue;seen.add(a.code);const p=a.prices_cad?.[size];if(a.quote_required===true||!Number.isFinite(p))quoteOnly=true;else subtotal+=Math.round(p*100);}
 return {subtotal_cents:subtotal,deposit_cents:guidedDepositCents936(pkg),quote_only:quoteOnly};
}
export function minimumSlots936(policy){const n=Number(policy?.minimum_duration_slots||1);return [1,2].includes(n)?n:null;}
export function appointmentKey936({date,slot,area}={}){return JSON.stringify([date||'',slot||'',area||'']);}
export function createAvailabilityGate936(){let seq=0;return {begin(request){return {seq:++seq,key:appointmentKey936(request)};},accept(ticket,current){return ticket?.seq===seq&&ticket.key===appointmentKey936(current);}};}
export function slotFits936(data,date,slot,requireRequestedFit=false){
 if(data?.ok!==true||data.date!==date||data.blocked||data.business_hours_conflict===true||data.business_hours?.is_closed===true)return false;
 const open=slot==='FULL'?data.AM===true&&data.PM===true:['AM','PM'].includes(slot)&&data[slot]===true;
 return open&&(!requireRequestedFit||data.capacity_reconciliation_738?.requested_fit===true);
}
