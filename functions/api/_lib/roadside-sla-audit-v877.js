// Rosie 877 — original immutable case age drives owner SLA audit.
// A fresh page refresh must NEVER reset the SLA clock.
const hours={CRITICAL:1,HIGH:4,REVIEW:24};
export function auditOriginalEscalationSla({policy,cases=[],nowMs=Date.now()}={}){
 const severity=policy?.severity;
 if(severity==='NONE'&&policy?.owner_alert===false&&
   !cases.some(x=>['open','reviewed_hold'].includes(x?.state)))
  return {state:'NO_CURRENT_ALERT',breached:false,source_anchor_verified:false,
   owner_followup_required:false,original_case_persisted:false};
 const open=Array.isArray(cases)?cases.filter(x=>['open','reviewed_hold'].includes(x?.state)):[];
 const started=open.map(x=>Date.parse(x.opened_at))
  .filter(t=>Number.isFinite(t)&&t>=0&&t<=nowMs)
  .sort((a,b)=>a-b)[0];
 if(!Number.isFinite(started)||!hours[severity])
  return {state:'SLA_UNANCHORED_HOLD',breached:null,
   source_anchor_verified:false,owner_followup_required:true,
   reason:'No original unresolved case timestamp to anchor the escalation deadline'};
 const dueMs=started+hours[severity]*3600000;
 const breach=nowMs>dueMs;
 return {state:breach?'SLA_BREACHED':'SLA_WITHIN_POLICY',
  severity,breached:breach,source_anchor_verified:true,
  owner_followup_required:true,original_case_persisted:true,
  original_case_opened_at:new Date(started).toISOString(),
  due_at:new Date(dueMs).toISOString(),
  age_minutes:Math.max(0,Math.floor((nowMs-started)/60000)),
  overdue_minutes:breach?Math.floor((nowMs-dueMs)/60000):0,
  policy_hours:hours[severity],no_case_status_changed:true};
}
export function summarizeOriginalEscalationSla(reviews,{partial=false}={}){
 const stats={breached:0,on_time:0,unanchored:0,no_alert:0};
 for(const x of reviews||[]){
  if(x.state==='SLA_BREACHED')stats.breached++;
  else if(x.state==='SLA_WITHIN_POLICY')stats.on_time++;
  else if(x.state==='NO_CURRENT_ALERT')stats.no_alert++;
  else stats.unanchored++;
 }
 return {schema:'rosie-roadside-sla-v877',...stats,
  coverage:partial?'PARTIAL':'BOUNDED',
  manual_owner_attention:partial||stats.breached>0||stats.unanchored>0,
  no_automatic_case_closure:true,
  no_financial_mutation:true};
}
