// Build 745: deterministic assigned-job grouping and stage safety. No network, storage or mutation.
const CLOSED_STAGES745=new Set(['completed','cancelled','canceled','declined','awaiting_payment']);
export const MOBILE_STAGE_ACTIONS745=Object.freeze({
  pending:['accept','decline'],scheduled:['accept','decline','dispatch'],accepted:['dispatch','decline'],
  dispatched:['arrive'],arrived:['start'],detailing:['pause','complete'],paused:['resume','complete']
});

export function mobileStage745(job={}) {
  return String(job?.current_workflow_stage || job?.job_status || job?.status || '').trim().toLowerCase();
}
export function allowedMobileTransition745(stage,action) {
  return (MOBILE_STAGE_ACTIONS745[String(stage||'').trim().toLowerCase()]||[]).includes(String(action||''));
}
export function torontoDay745(now=new Date()) {
  const values=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=key=>values.find(value=>value.type===key)?.value||'';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function mobileBoardGroups745(rows=[],{now=new Date(),filter='all'}={}) {
  const today=torontoDay745(now);
  const weekEnd=new Date(Date.parse(`${today}T12:00:00Z`)+7*86400000).toISOString().slice(0,10);
  const matches=(row)=>{
    const day=String(row?.service_date||'').slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||CLOSED_STAGES745.has(mobileStage745(row)))return false;
    if(filter==='today')return day===today;
    if(filter==='week')return day>=today&&day<weekEnd;
    return true;
  };
  const jobs=(Array.isArray(rows)?rows:[]).filter(matches).sort((a,b)=>
    String(a.service_date).localeCompare(String(b.service_date))||
    String(a.start_slot||'').localeCompare(String(b.start_slot||''))||String(a.id||'').localeCompare(String(b.id||''))
  );
  const groups=[];
  for(const job of jobs){
    const day=String(job.service_date).slice(0,10);
    let group=groups.at(-1);
    if(group?.date!==day){group={date:day,label:day===today?'Today':day<today?'Earlier assigned work':day,jobs:[]};groups.push(group);}
    group.jobs.push(job);
  }
  return {groups,total:jobs.length,scope:'assigned_only',today,filter,route_order:'date_then_slot_not_navigation'};
}
export function reconciliationMessage745({wasOffline=false,assignmentGone=false,stageChanged=false}={}) {
  if(assignmentGone)return 'Previously selected job is no longer assigned to this account. It was removed from the action workspace.';
  if(stageChanged)return 'The job changed while this device was disconnected. Review the new stage and evidence before taking another action.';
  if(wasOffline)return 'Current assigned jobs were reloaded from the server. Review the latest instructions before a new action.';
  return 'Assigned jobs verified against the live staff session.';
}
