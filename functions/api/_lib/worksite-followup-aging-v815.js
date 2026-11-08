// Build 815 advisory triage, never a customer response promise or automatic SLA.
export function followupAging815(row,now=Date.now()){
  if(row?.status==='staff_replied')return {band:'customer_review',hours:null,label:'Awaiting customer confirmation'};
  if(row?.status!=='awaiting_staff')return {band:'finished',hours:null,label:'No staff response pending'};
  const requested=Date.parse(row.requested_at),current=typeof now==='number'?now:new Date(now).getTime();
  if(!Number.isFinite(requested)||!Number.isFinite(current)||requested>current)
    return {band:'unknown',hours:null,label:'Waiting for staff response — age unavailable'};
  const hours=Math.floor((current-requested)/3600000);
  return {band:hours>=48?'overdue':hours>=24?'attention':'new',hours,
    label:hours>=48?'Over 48 hours — supervisor review suggested':hours>=24?'Over 24 hours — review soon':'Newer than 24 hours'};
}
export function customerNextStep815(row,escalation){
  if(row?.status==='staff_replied')return 'Rosie has recorded a response. Please review it below and confirm whether it resolved the concern.';
  if(row?.status==='confirmed')return 'You confirmed this response resolved the concern.';
  if(row?.status==='needs_more_help')return 'More help was requested. You may open another follow-up or contact Rosie directly.';
  if(escalation?.status==='flagged')return 'A supervisor review has been flagged. Refresh My Account for progress; urgent access or safety concerns should be raised directly with Rosie.';
  if(escalation?.status==='acknowledged')return 'A supervisor has acknowledged the review. A response has not yet been recorded. Refresh for updates.';
  return 'Your question is waiting for a staff response. Refresh My Account for an update; for urgent access or safety concerns contact Rosie directly.';
}
