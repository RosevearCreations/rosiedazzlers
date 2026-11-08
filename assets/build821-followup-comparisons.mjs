// Build 821: comparisons and explanations from the same bounded, filtered read-only snapshot.
// No historical totals, persisted baseline, private data, exports or customer-side effects.
const FIELDS=Object.freeze(['waiting','responded','needs_help','confirmed','review','total']);
export const COMPARISON_MODES_821=Object.freeze([
  {key:'adjacent',label:'Last 24 hours versus previous 24 hours'},
  {key:'recent_older',label:'Last 7 days versus older loaded requests'},
  {key:'known_unknown',label:'Valid request dates versus missing/future dates'},
]);
const valid=n=>Number.isSafeInteger(n)&&n>=0&&n<=150;
const checkedGroup=(snapshot,key)=>{
  const group=snapshot?.cohorts?.[key];
  if(!group||!FIELDS.every(field=>valid(group[field]))||FIELDS.slice(0,5).reduce((n,field)=>n+group[field],0)!==group.total)return null;
  return Object.fromEntries(FIELDS.map(field=>[field,group[field]]));
};
const combine=(groups)=>Object.fromEntries(FIELDS.map(field=>[field,groups.reduce((n,group)=>n+group[field],0)]));

export function compareSnapshots821(snapshot,mode='adjacent'){
  if(snapshot?.scope!=='filtered-newest-150-maximum'||!COMPARISON_MODES_821.some(m=>m.key===mode))return {ok:false,reason:'Choose a supported comparison after loading verified follow-ups.'};
  const keys=mode==='adjacent'?[['latest'],['previous']]:mode==='recent_older'?[['latest','previous','week'],['older']]:[['latest','previous','week','older'],['unknown']];
  const groups=keys.map(part=>part.map(key=>checkedGroup(snapshot,key)));
  if(groups.some(part=>part.some(g=>!g)))return {ok:false,reason:'One or more requested cohort totals are unverified. Refresh the authorized queue.'};
  const left=combine(groups[0]),right=combine(groups[1]);
  if(!valid(left.total)||!valid(right.total)||left.total+right.total>150)return {ok:false,reason:'Comparison exceeds the bounded source. Refresh the authorized queue.'};
  return {
    ok:true,mode,left,right,
    leftLabel:mode==='adjacent'?'Last 24 hours':mode==='recent_older'?'Last 7 days':'Valid request dates',
    rightLabel:mode==='adjacent'?'Previous 24 hours':mode==='recent_older'?'Older than 7 days':'Missing/future dates',
    difference:mode==='adjacent'?left.total-right.total:null,
    guidance:mode==='adjacent'?'Equal-duration windows. The difference is only between currently loaded requests, not a true historical growth rate.':
      mode==='recent_older'?'These periods are unequal and the oldest requests may fall outside the newest 150. Do not calculate a growth rate.':
      'Unknown dates need source review; never assign them to a real time window or infer a response deadline.',
  };
}

export function workloadExplanations821(signals){
  const definitions=[
    ['waiting','Awaiting staff','Only source-consistent follow-ups still awaiting a staff answer; a response deadline is not promised.'],
    ['older48h','More than 48 hours','An advisory count of waiting follow-ups with valid request dates at least 48 hours old; not an SLA breach.'],
    ['unknownAge','Request age unverified','Waiting follow-ups with missing, invalid or future request dates; they cannot be classified as recent or overdue.'],
    ['unowned','Owner not assigned','Only counted after the separate authorized ownership source verifies the absence of an assignment.'],
    ['reviewPast','Internal review target passed','Assigned reviewers with a verified internal review time in the past; not a customer promise.'],
    ['openEscalations','Open supervisor review','Only source-verified uncleared escalations among waiting records; no automatic escalation is triggered.'],
  ];
  return definitions.map(([key,label,explanation])=>({key,label,explanation,count:valid(signals?.[key])?signals[key]:null}));
}

export function readableReport821(comparison,signals){
  if(!comparison?.ok)return 'No verified comparison is available. Load the authorized follow-up queue first.';
  const review=workloadExplanations821(signals).map(x=>`${x.label}: ${x.count===null?'source unavailable':x.count}.`).join(' ');
  const difference=comparison.difference===null?'No count difference is calculated for unequal or date-integrity groups.':
    `Observed request count difference (first minus second): ${comparison.difference}.`;
  return `Read-only comparison of the current filtered, newest 150 authorized follow-ups at most. ${comparison.leftLabel}: ${comparison.left.total}. ${comparison.rightLabel}: ${comparison.right.total}. ${difference} ${comparison.guidance} Workload guidance: ${review} No saved report, external export, customer message, booking change or automatic closure.`;
}
