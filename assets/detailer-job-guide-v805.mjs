// Build 805: display-only, booking-scoped progress guidance. Server evidence remains authoritative.
export const FIELD_STEPS805 = Object.freeze([
  {key:'onsiteReady',label:'Arrival and safe setup',target:'onsite746Panel',phase:'before'},
  {key:'beforePhoto',label:'Private before photos',target:'prepareBeforePhoto2',phase:'before'},
  {key:'checklist',label:'Service checklist',target:'fieldCheckCondition805',phase:'before'},
  {key:'addons',label:'Approved scope',target:'fieldAddons',phase:'during'},
  {key:'products',label:'Product-use record',target:'fieldProducts',phase:'during'},
  {key:'completion',label:'Completion notes',target:'fieldCompletion',phase:'after'},
  {key:'afterPhoto',label:'Private after photos',target:'prepareAfterPhoto2',phase:'after'}
]);

export function proofCounts805(proof){
  const stages=proof?.stage_counts||proof?.counts||{};
  const count=key=>{
    const value=Number(stages[key]);
    return Number.isSafeInteger(value)&&value>0?value:0;
  };
  return {before:count('arrival'),after:count('final')};
}

export function fieldGuide805({fieldState,stage,assignmentVerified,feedVerified,online,pendingUpload}={}){
  const current=assignmentVerified===true&&feedVerified===true&&online===true&&fieldState?.loaded===true;
  const phase=String(stage||'').toLowerCase();
  const steps=FIELD_STEPS805.map(step=>({
    ...step,
    status:!current?'recheck':fieldState[step.key]===true?'done':
      step.key==='onsiteReady'&&phase!=='arrived'?'review':'open'
  }));
  const complete=steps.filter(step=>step.status==='done').length;
  const missing=steps.filter(step=>step.status==='open');
  const next=steps.find(step=>step.status==='open'&&
    (phase==='arrived'?step.phase==='before':phase==='detailing'||phase==='paused'))||null;
  const pending=Boolean(pendingUpload);
  return {
    current,complete,total:steps.length,steps,pending,
    next:current&&!pending?next:null,
    message:!current?'Evidence needs a fresh, verified job and feed read. No action will be replayed.':
      pending?'An original upload is unresolved. Inspect the existing session before another photo.':
      fieldState.canComplete===true?'Field evidence recorded. Independent quality approval and the server completion gate still apply.':
      missing.length?`${missing.length} field item(s) still need evidence. The server decides when Start or Complete is allowed.`:
      'No missing field items shown. Recheck Operations quality approval before completion.'
  };
}
