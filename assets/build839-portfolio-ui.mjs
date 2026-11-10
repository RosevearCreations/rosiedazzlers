import {PORTFOLIO_SCHEMA_839,reconcilePortfolio839}
  from './build839-portfolio-readiness.mjs';

const $=id=>document.getElementById(id);
let report=null,busy=false;
const append=(parent,tag,value)=>{
  const node=document.createElement(tag);node.textContent=String(value??'UNKNOWN');
  parent.append(node);return node;
};
const pct=value=>Number.isFinite(value)?value+'%':'UNKNOWN';
function render(){
  const rows=$('build839Rows');rows.textContent='';
  const query=$('build839Search').value.trim().toLowerCase();
  const filter=$('build839Filter').value;
  if(!report){
    $('build839Count').textContent='No current authenticated portfolio review. All owner and Master approvals HOLD.';
    return;
  }
  const shown=report.scopes.filter(row=>{
    if(filter==='linked'&&row.localChainStatus!=='LOCAL_CHAIN_LINKED_UNVERIFIED')return false;
    if(filter==='conflict'&&row.localChainStatus!=='CONFLICT')return false;
    if(filter==='missing'&&row.localChainStatus==='LOCAL_CHAIN_LINKED_UNVERIFIED')return false;
    return !query||[row.moduleName,row.moduleId,row.scopeId,row.requirementId,
      row.proposedOwnerRole].join(' ').toLowerCase().includes(query);
  });
  for(const row of shown){
    const tr=document.createElement('tr');
    const th=append(tr,'th',row.moduleName);th.scope='row';
    append(tr,'td',pct(row.provisionalBuiltEstimate)+' built / '+
      pct(row.provisionalProvenEstimate)+' proven · Nov 8 estimate');
    append(tr,'td','No approved second snapshot · change UNKNOWN');
    append(tr,'td',row.localChainStatus+' · '+row.localDecision);
    append(tr,'td','HOLD · unsigned original owner decision');
    append(tr,'td','UNKNOWN numerator/denominator/weight · AI Data HOLD');
    const action=document.createElement('td');
    append(action,'p',row.nextAction);
    const link=document.createElement('a');link.href='/admin-handoff-acceptance.html#build828Provenance';
    link.textContent='Open original review lineage';action.append(link);tr.append(action);rows.append(tr);
  }
  $('build839Count').textContent=`${shown.length} of ${report.scopeDrafts} scopes shown · `+
    `${report.requirementDrafts} proposed shared requirements · `+
    `${report.sourceReview.localLinkedCount} local chains, `+
    `${report.sourceReview.localConflictCount} conflicts; zero independently owner-approved scopes.`;
  $('build839Summary').textContent='Historical November 8 audit only. One provisional snapshot; '+
    'zero independently approved comparable snapshots. Neither weighted nor unweighted '+
    'completion, percentage-point trend, confidence interval or portfolio GREEN can be computed.';
  $('build839Signoff').textContent='Owner signoff HOLD: approved scope and weighting, original '+
    'field/provider evidence, independent reviewer, signed owner decision and source receipt '+
    'must be supplied through their separate authorized processes. A local supervisor '+
    'signoff is only a review candidate.';
  $('build839Master').textContent='Rosie source shell → AI Data Platform intelligence: DISCONNECTED / HOLD. '+
    'Rosie source shell → Comms Hub operations: DISCONNECTED / HOLD. '+
    'No Master ACK, outbound event, score, customer records or implicit peer permissions.';
  $('build839Revision').textContent='Runtime revision claim: '+
    (report.runtimeRevisionClaim?.slice(0,12)||'unavailable')+
    ' · exact-SHA Production acceptance is verified outside this dashboard.';
}
const read=async path=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{const response=await fetch(path,{credentials:'same-origin',cache:'no-store',
    headers:{Accept:'application/json'},signal:controller.signal});
    return {status:response.status,body:await response.json().catch(()=>null)};
  }catch{return {status:503,body:null};}finally{clearTimeout(timer);}
};
async function refresh(){
  if(busy)return;busy=true;$('build839Refresh').disabled=true;
  $('build839State').textContent='Reading authorized Rosie source scope once…';
  try{
    const base=await read('/api/admin/module_portfolio_readiness_v839');
    if(base.status!==200||base.body?.ok!==true||
       base.body?.report?.schema!==PORTFOLIO_SCHEMA_839||
       base.body?.report?.sourceId!=='rosiedazzlers'||
       base.body?.report?.signedStaffSession!==true)
      throw Error('Administrator portfolio authority unavailable');
    const source=await read('/api/admin/worksite_field_evidence_v826');
    const value=reconcilePortfolio839(base.body.report,source,Date.now());
    if(value.masterPortfolio.portfolioGreen!==false||
       value.masterPortfolio.approvedNumerator!==null||
       value.safeguards.databaseWrites!==0||value.safeguards.masterEvents!==0)
      throw Error('Unapproved source score');
    report=value;render();
    $('build839State').textContent=value.sourceReview.state+' · '+value.generatedAt+
      ' · private, one-time review only; owner acceptance remains HOLD.';
  }catch{
    report=null;render();
    $('build839State').textContent='Private portfolio source unavailable · HOLD.';
    $('build839Summary').textContent='No current source evidence or approved trend available.';
    $('build839Signoff').textContent='Owner signoff unverified; retain HOLD.';
    $('build839Master').textContent='AI Data and Comms consumer acceptance unverified; HOLD.';
    $('build839Revision').textContent='No deployment proof is established by this view.';
  }finally{busy=false;$('build839Refresh').disabled=false;}
}
export function startPortfolioReadiness839(){
  if(!$('build839Refresh'))return;
  $('build839Search').addEventListener('input',render);
  $('build839Filter').addEventListener('change',render);
  $('build839Refresh').addEventListener('click',refresh);
  render();refresh();
}
